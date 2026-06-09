module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertEnv();

    const range = readDateRange(req.query);
    const previousRange = derivePreviousRange(range);
    const [
      orderRows,
      previousOrderRows,
      lineItemRows,
      couponRows,
      ga4Rows,
      previousGa4Rows,
      adRows,
      previousAdRows,
      goalRows,
      syncRows,
    ] = await Promise.all([
      supabaseFetch(
        `/rest/v1/orders?select=id,customer_id,total_price,subtotal_price,total_refunded,created_at,source_name,customer_country,discount_codes&created_at=gte.${encodeURIComponent(range.startIso)}&created_at=lte.${encodeURIComponent(range.endIso)}&limit=20000`,
      ),
      supabaseFetch(
        `/rest/v1/orders?select=id,customer_id,total_price,subtotal_price,total_refunded,created_at,source_name,customer_country,discount_codes&created_at=gte.${encodeURIComponent(previousRange.startIso)}&created_at=lte.${encodeURIComponent(previousRange.endIso)}&limit=20000`,
      ),
      supabaseFetch("/rest/v1/order_line_items?select=order_id,title,sku,quantity,price&limit=30000"),
      supabaseFetch("/rest/v1/coupon_codes?select=code,category&limit=10000"),
      supabaseFetch(
        `/rest/v1/ga4_daily_metrics?select=day,sessions,users,add_to_carts,checkouts,purchases&day=gte.${range.start}&day=lte.${range.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/ga4_daily_metrics?select=day,sessions,users,add_to_carts,checkouts,purchases&day=gte.${previousRange.start}&day=lte.${previousRange.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/ad_daily_metrics?select=day,source,spend,revenue,impressions,clicks,purchases&day=gte.${range.start}&day=lte.${range.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/ad_daily_metrics?select=day,source,spend,revenue,impressions,clicks,purchases&day=gte.${previousRange.start}&day=lte.${previousRange.end}&limit=10000`,
      ),
      supabaseFetch(
        "/rest/v1/goals?or=(is_active.eq.true,status.eq.active)&select=id,name,description,start_date,end_date,target_gmv,status,is_active&order=is_active.desc,start_date.asc&limit=1",
      ),
      supabaseFetch(
        "/rest/v1/sync_state?select=source,last_synced_at,status,updated_at&source=in.(shopify,ga4,google_ads,meta_ads)&limit=20",
      ),
    ]);

    const orderIds = new Set(orderRows.map((row) => row.id));
    const filteredLineItems = lineItemRows.filter((row) => orderIds.has(row.order_id));

    const summary = summarizeOrders(orderRows);
    const dailySales = buildDailySales(orderRows);
    const topProducts = buildTopProducts(filteredLineItems);
    const countrySales = buildCountrySales(orderRows);
    const customerSegments = buildCustomerSegments(orderRows);
    const customerQuality = buildCustomerQuality(orderRows);
    const previousSummary = summarizeOrders(previousOrderRows);
    const previousCustomerQuality = buildCustomerQuality(previousOrderRows);
    const couponUsage = buildCouponUsage(orderRows, couponRows);
    const channelSales = buildChannelSales(orderRows);
    const ga4Funnel = buildGa4Funnel(ga4Rows);
    const previousGa4Funnel = buildGa4Funnel(previousGa4Rows);
    const ga4Daily = buildGa4Daily(ga4Rows);
    const adPerformance = buildAdPerformance(adRows);
    const previousAdPerformance = buildAdPerformance(previousAdRows);
    const adDaily = buildAdDaily(adRows);
    const sync = buildSyncSummary(syncRows);
    const activeGoal = await buildActiveGoal(goalRows[0], range, summary, ga4Funnel);

    return res.status(200).json({
      ok: true,
      range,
      summary,
      daily_sales: dailySales,
      top_products: topProducts,
      country_sales: countrySales,
      customer_segments: customerSegments,
      customer_quality: customerQuality.summary,
      customer_daily: customerQuality.daily,
      coupon_usage: couponUsage,
      channel_sales: channelSales,
      ga4_funnel: ga4Funnel,
      ga4_daily: ga4Daily,
      ad_performance: adPerformance,
      ad_daily: adDaily,
      previous: {
        range: previousRange,
        summary: previousSummary,
        customer_quality: previousCustomerQuality.summary,
        ga4_funnel: previousGa4Funnel,
        ad_performance: previousAdPerformance,
      },
      active_goal: activeGoal,
      sync,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to load dashboard data",
      details: error.details,
    });
  }
};

function assertEnv() {
  const missing = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function readDateRange(query) {
  const today = new Date();
  const fallbackEnd = toDateOnly(today);
  const fallbackStartDate = new Date(today);
  fallbackStartDate.setDate(fallbackStartDate.getDate() - 29);
  const fallbackStart = toDateOnly(fallbackStartDate);

  const start = sanitizeDate(query.start) || fallbackStart;
  const end = sanitizeDate(query.end) || fallbackEnd;

  if (start > end) {
    const error = new Error("Invalid date range");
    error.statusCode = 400;
    error.details = { start, end };
    throw error;
  }

  return {
    start,
    end,
    startIso: `${start}T00:00:00.000Z`,
    endIso: `${end}T23:59:59.999Z`,
  };
}

function derivePreviousRange(range) {
  const days = inclusiveDays(range.start, range.end);
  const startDate = new Date(`${range.start}T00:00:00Z`);
  const previousEndDate = new Date(startDate);
  previousEndDate.setUTCDate(previousEndDate.getUTCDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setUTCDate(previousStartDate.getUTCDate() - (days - 1));
  const start = toDateOnly(previousStartDate);
  const end = toDateOnly(previousEndDate);
  return {
    start,
    end,
    startIso: `${start}T00:00:00.000Z`,
    endIso: `${end}T23:59:59.999Z`,
  };
}

function sanitizeDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function toDateOnly(value) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function summarizeOrders(rows) {
  const summary = rows.reduce(
    (result, row) => {
      const total = number(row.total_price);
      const gross = number(row.subtotal_price || row.total_price);
      const refunded = number(row.total_refunded);
      result.orders += 1;
      result.gmv += total;
      result.gross_sales += gross;
      result.net_sales += total - refunded;
      result.refunds += refunded;
      if (Array.isArray(row.discount_codes) && row.discount_codes.length) result.coupon_orders += 1;
      if (row.customer_id) result.customerIds.add(row.customer_id);
      return result;
    },
    { orders: 0, gmv: 0, gross_sales: 0, net_sales: 0, refunds: 0, coupon_orders: 0, customerIds: new Set() },
  );

  return {
    gmv: round(summary.gmv),
    gross_sales: round(summary.gross_sales),
    net_sales: round(summary.net_sales),
    orders: summary.orders,
    customers: summary.customerIds.size,
    aov: round(summary.orders ? summary.gmv / summary.orders : 0),
    refunds: round(summary.refunds),
    refund_rate: round(summary.gmv ? (summary.refunds / summary.gmv) * 100 : 0),
    coupon_order_rate: round(summary.orders ? (summary.coupon_orders / summary.orders) * 100 : 0),
  };
}

function buildDailySales(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const day = String(row.created_at || "").slice(0, 10);
    if (!day) return;
    if (!grouped.has(day)) {
      grouped.set(day, {
        day,
        orders: 0,
        customers: new Set(),
        gmv: 0,
        gross_sales: 0,
        aovSeed: 0,
        refunds: 0,
        coupon_orders: 0,
      });
    }
    const item = grouped.get(day);
    item.orders += 1;
    item.gmv += number(row.total_price);
    item.gross_sales += number(row.subtotal_price || row.total_price);
    item.aovSeed += number(row.total_price);
    item.refunds += number(row.total_refunded);
    if (Array.isArray(row.discount_codes) && row.discount_codes.length) item.coupon_orders += 1;
    if (row.customer_id) item.customers.add(row.customer_id);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      day: item.day,
      orders: item.orders,
      customers: item.customers.size,
      gmv: round(item.gmv),
      gross_sales: round(item.gross_sales),
      aov: round(item.orders ? item.aovSeed / item.orders : 0),
      refunds: round(item.refunds),
      coupon_order_rate: round(item.orders ? (item.coupon_orders / item.orders) * 100 : 0),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function buildTopProducts(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${row.title || "Unknown"}::${row.sku || ""}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: row.title || "Unknown product",
        sku: row.sku || "",
        units_sold: 0,
        revenue: 0,
      });
    }
    const item = grouped.get(key);
    const quantity = number(row.quantity);
    item.units_sold += quantity;
    item.revenue += quantity * number(row.price);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      revenue: round(item.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function buildCountrySales(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.customer_country || "Unknown";
    if (!grouped.has(key)) {
      grouped.set(key, { country: key, orders: 0, customers: new Set(), revenue: 0 });
    }
    const item = grouped.get(key);
    item.orders += 1;
    item.revenue += number(row.total_price);
    if (row.customer_id) item.customers.add(row.customer_id);
  });
  const totalOrders = rows.length || 1;
  return Array.from(grouped.values())
    .map((item) => ({
      country: item.country,
      orders: item.orders,
      customers: item.customers.size,
      revenue: round(item.revenue),
      aov: round(item.orders ? item.revenue / item.orders : 0),
      order_share: round((item.orders / totalOrders) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function buildCustomerSegments(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    if (!row.customer_id) return;
    if (!grouped.has(row.customer_id)) {
      grouped.set(row.customer_id, { orders: 0, revenue: 0 });
    }
    const item = grouped.get(row.customer_id);
    item.orders += 1;
    item.revenue += number(row.total_price);
  });

  const segments = new Map();
  grouped.forEach((item) => {
    const segment =
      item.orders <= 1 ? "单次购买" : item.revenue >= 500 ? "高价值客户" : "复购客户";
    if (!segments.has(segment)) {
      segments.set(segment, { segment, customers: 0, revenue: 0 });
    }
    const bucket = segments.get(segment);
    bucket.customers += 1;
    bucket.revenue += item.revenue;
  });

  return Array.from(segments.values())
    .map((item) => ({
      segment: item.segment,
      customers: item.customers,
      revenue: round(item.revenue),
      avg_customer_value: round(item.customers ? item.revenue / item.customers : 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildCustomerQuality(rows) {
  const byCustomer = new Map();
  rows.forEach((row) => {
    if (!row.customer_id) return;
    if (!byCustomer.has(row.customer_id)) byCustomer.set(row.customer_id, []);
    byCustomer.get(row.customer_id).push(row);
  });

  const summary = {
    new_customer_revenue: 0,
    returning_customer_revenue: 0,
    new_customer_orders: 0,
    returning_customer_orders: 0,
    total_customers: byCustomer.size,
    returning_customers: 0,
  };
  const daily = new Map();

  byCustomer.forEach((orders) => {
    const sorted = [...orders].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    if (sorted.length > 1) summary.returning_customers += 1;

    sorted.forEach((order, index) => {
      const day = String(order.created_at || "").slice(0, 10);
      if (!day) return;
      if (!daily.has(day)) {
        daily.set(day, {
          day,
          new_customer_revenue: 0,
          returning_customer_revenue: 0,
          new_customer_orders: 0,
          returning_customer_orders: 0,
          customer_ids: new Set(),
          returning_customer_ids: new Set(),
        });
      }
      const bucket = daily.get(day);
      const total = number(order.total_price);
      bucket.customer_ids.add(order.customer_id);
      if (index === 0) {
        summary.new_customer_revenue += total;
        summary.new_customer_orders += 1;
        bucket.new_customer_revenue += total;
        bucket.new_customer_orders += 1;
      } else {
        summary.returning_customer_revenue += total;
        summary.returning_customer_orders += 1;
        bucket.returning_customer_revenue += total;
        bucket.returning_customer_orders += 1;
        bucket.returning_customer_ids.add(order.customer_id);
      }
    });
  });

  const repeatRate = round(summary.total_customers ? (summary.returning_customers / summary.total_customers) * 100 : 0);
  const newCustomers = Math.max(summary.total_customers - summary.returning_customers, 0);
  const avgCustomerValue = round(summary.total_customers ? (summary.new_customer_revenue + summary.returning_customer_revenue) / summary.total_customers : 0);
  const purchaseFrequency = round(summary.total_customers ? (summary.new_customer_orders + summary.returning_customer_orders) / summary.total_customers : 0);

  return {
    summary: {
      new_customers: newCustomers,
      new_customer_revenue: round(summary.new_customer_revenue),
      returning_customer_revenue: round(summary.returning_customer_revenue),
      new_customer_orders: summary.new_customer_orders,
      returning_customer_orders: summary.returning_customer_orders,
      returning_customers: summary.returning_customers,
      total_customers: summary.total_customers,
      repeat_rate: repeatRate,
      avg_customer_value: avgCustomerValue,
      purchase_frequency: purchaseFrequency,
    },
    daily: Array.from(daily.values())
      .map((item) => ({
        day: item.day,
        customers: item.customer_ids.size,
        returning_customers: item.returning_customer_ids.size,
        new_customer_revenue: round(item.new_customer_revenue),
        returning_customer_revenue: round(item.returning_customer_revenue),
        new_customer_orders: item.new_customer_orders,
        returning_customer_orders: item.returning_customer_orders,
        total_orders: item.new_customer_orders + item.returning_customer_orders,
        avg_customer_value: round(
          item.customer_ids.size ? (item.new_customer_revenue + item.returning_customer_revenue) / item.customer_ids.size : 0,
        ),
        purchase_frequency: round(
          item.customer_ids.size ? (item.new_customer_orders + item.returning_customer_orders) / item.customer_ids.size : 0,
        ),
        repeat_rate: round(
          item.customer_ids.size
            ? (item.returning_customer_ids.size / item.customer_ids.size) * 100
            : 0,
        ),
      }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
}

function buildCouponUsage(orderRows, couponRows) {
  const codeToCategory = new Map();
  couponRows.forEach((row) => {
    if (row.code) codeToCategory.set(row.code, row.category || "Unknown");
  });

  const grouped = new Map();
  orderRows.forEach((row) => {
    const codes = Array.isArray(row.discount_codes) ? row.discount_codes : [];
    const categories = new Set(
      (codes.length ? codes : ["未用券"])
        .map((code) => (code === "未用券" ? code : codeToCategory.get(code) || "其他券"))
        .filter(Boolean),
    );
    categories.forEach((category) => {
      if (!grouped.has(category)) grouped.set(category, { category, orders: 0, revenue: 0 });
      const item = grouped.get(category);
      item.orders += 1;
      item.revenue += number(row.total_price);
    });
  });

  const totalOrders = Array.from(grouped.values()).reduce((sum, row) => sum + row.orders, 0) || 1;
  return Array.from(grouped.values())
    .map((item) => ({
      category: item.category,
      orders: item.orders,
      revenue: round(item.revenue),
      order_share: round((item.orders / totalOrders) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildChannelSales(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.source_name || "unknown";
    if (!grouped.has(key)) {
      grouped.set(key, { channel: key, orders: 0, customers: new Set(), revenue: 0 });
    }
    const item = grouped.get(key);
    item.orders += 1;
    item.revenue += number(row.total_price);
    if (row.customer_id) item.customers.add(row.customer_id);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      channel: item.channel,
      orders: item.orders,
      customers: item.customers.size,
      revenue: round(item.revenue),
      aov: round(item.orders ? item.revenue / item.orders : 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildGa4Funnel(rows) {
  const result = rows.reduce(
    (item, row) => {
      item.sessions += number(row.sessions);
      item.users += number(row.users);
      item.add_to_carts += number(row.add_to_carts);
      item.checkouts += number(row.checkouts);
      item.purchases += number(row.purchases);
      return item;
    },
    { sessions: 0, users: 0, add_to_carts: 0, checkouts: 0, purchases: 0 },
  );

  return {
    ...result,
    add_to_cart_rate: round(result.sessions ? (result.add_to_carts / result.sessions) * 100 : 0),
    checkout_rate: round(result.sessions ? (result.checkouts / result.sessions) * 100 : 0),
    cvr: round(result.sessions ? (result.purchases / result.sessions) * 100 : 0),
  };
}

function buildGa4Daily(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const day = String(row.day || "").slice(0, 10);
    if (!day) return;
    if (!grouped.has(day)) {
      grouped.set(day, { day, sessions: 0, users: 0, add_to_carts: 0, checkouts: 0, purchases: 0 });
    }
    const item = grouped.get(day);
    item.sessions += number(row.sessions);
    item.users += number(row.users);
    item.add_to_carts += number(row.add_to_carts);
    item.checkouts += number(row.checkouts);
    item.purchases += number(row.purchases);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      add_to_cart_rate: round(item.sessions ? (item.add_to_carts / item.sessions) * 100 : 0),
      checkout_rate: round(item.sessions ? (item.checkouts / item.sessions) * 100 : 0),
      cvr: round(item.sessions ? (item.purchases / item.sessions) * 100 : 0),
      payment_completion_rate: round(item.checkouts ? (item.purchases / item.checkouts) * 100 : 0),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function buildAdPerformance(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.source || "unknown";
    if (!grouped.has(key)) {
      grouped.set(key, {
        source: key,
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        purchases: 0,
      });
    }
    const item = grouped.get(key);
    item.spend += number(row.spend);
    item.revenue += number(row.revenue);
    item.impressions += number(row.impressions);
    item.clicks += number(row.clicks);
    item.purchases += number(row.purchases);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      spend: round(item.spend),
      revenue: round(item.revenue),
      roas: round(item.spend ? item.revenue / item.spend : 0),
      cpa: round(item.purchases ? item.spend / item.purchases : 0),
      ctr: round(item.impressions ? (item.clicks / item.impressions) * 100 : 0),
      cpc: round(item.clicks ? item.spend / item.clicks : 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildAdDaily(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const day = String(row.day || "").slice(0, 10);
    if (!day) return;
    if (!grouped.has(day)) {
      grouped.set(day, {
        day,
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        purchases: 0,
      });
    }
    const item = grouped.get(day);
    item.spend += number(row.spend);
    item.revenue += number(row.revenue);
    item.impressions += number(row.impressions);
    item.clicks += number(row.clicks);
    item.purchases += number(row.purchases);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      spend: round(item.spend),
      revenue: round(item.revenue),
      roas: round(item.spend ? item.revenue / item.spend : 0),
      cpa: round(item.purchases ? item.spend / item.purchases : 0),
      ctr: round(item.impressions ? (item.clicks / item.impressions) * 100 : 0),
      cpc: round(item.clicks ? item.spend / item.clicks : 0),
      cpm: round(item.impressions ? (item.spend / item.impressions) * 1000 : 0),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function buildSyncSummary(rows) {
  const sorted = rows
    .filter((row) => row.last_synced_at)
    .sort((a, b) => String(b.last_synced_at).localeCompare(String(a.last_synced_at)));

  return {
    last_synced_at: sorted[0]?.last_synced_at || null,
    status: sorted[0]?.status || "unknown",
    updated_at: sorted[0]?.updated_at || null,
  };
}

async function buildActiveGoal(goalRow, range, summary, ga4Funnel) {
  if (!goalRow) return null;

  const goalStart = sanitizeDate(goalRow.start_date);
  const goalEnd = sanitizeDate(goalRow.end_date);
  const goalDays = inclusiveDays(goalStart, goalEnd);
  const selectedDays = inclusiveDays(range.start, range.end);
  const targetGmv = number(goalRow.target_gmv);
  const aov = number(summary.aov);
  const cvr = number(ga4Funnel.cvr);
  const selectedSessions = number(ga4Funnel.sessions);

  const goalOrders = await supabaseFetch(
    `/rest/v1/orders?select=total_price&created_at=gte.${encodeURIComponent(`${goalStart}T00:00:00.000Z`)}&created_at=lte.${encodeURIComponent(`${goalEnd}T23:59:59.999Z`)}&limit=20000`,
  );
  const currentGoalGmv = round(goalOrders.reduce((sum, row) => sum + number(row.total_price), 0));
  const achievementRate = round(targetGmv ? (currentGoalGmv / targetGmv) * 100 : 0);
  const requiredDailyGmv = round(goalDays ? targetGmv / goalDays : 0);
  const requiredDailyOrders = round(aov ? requiredDailyGmv / aov : 0);
  const requiredMonthlyOrders = Math.round(requiredDailyOrders * goalDays);
  const requiredMonthlySessions = Math.round(cvr ? requiredMonthlyOrders / (cvr / 100) : 0);
  const monthlyGmvRunRate = round(selectedDays ? summary.gmv * (goalDays / selectedDays) : 0);
  const monthlyOrdersRunRate = Math.round(selectedDays ? summary.orders * (goalDays / selectedDays) : 0);
  const monthlySessionsRunRate = Math.round(selectedDays ? selectedSessions * (goalDays / selectedDays) : 0);
  const forecastGoalGmv = round(monthlySessionsRunRate * (cvr / 100) * aov);
  const forecastGap = round(Math.max(targetGmv - forecastGoalGmv, 0));
  const actualGap = round(Math.max(targetGmv - currentGoalGmv, 0));
  const capabilityGap = round(Math.max(targetGmv - monthlyGmvRunRate, 0));
  const now = toDateOnly(new Date());
  const elapsedGoalDays = clampInclusiveDays(goalStart, now, goalEnd);
  const elapsedRate = round(goalDays ? (elapsedGoalDays / goalDays) * 100 : 0);
  const status =
    achievementRate >= elapsedRate ? "On Track" : achievementRate >= elapsedRate * 0.8 ? "Watch" : "Off Track";

  return {
    id: goalRow.id,
    name: goalRow.name,
    description: goalRow.description || "",
    start_date: goalStart,
    end_date: goalEnd,
    target_gmv: targetGmv,
    current_goal_gmv: currentGoalGmv,
    current_range_gmv: round(summary.gmv),
    current_range_orders: Number(summary.orders || 0),
    current_range_sessions: selectedSessions,
    achievement_rate: achievementRate,
    gap: capabilityGap,
    capability_gap: capabilityGap,
    forecast_gap: forecastGap,
    actual_gap: actualGap,
    goal_days: goalDays,
    selected_days: selectedDays,
    elapsed_goal_days: elapsedGoalDays,
    elapsed_rate: elapsedRate,
    status,
    required_daily_gmv: requiredDailyGmv,
    required_daily_orders: requiredDailyOrders,
    required_monthly_orders: requiredMonthlyOrders,
    required_monthly_sessions: requiredMonthlySessions,
    current_aov: aov,
    current_cvr: cvr,
    monthly_gmv_run_rate: monthlyGmvRunRate,
    monthly_orders_run_rate: monthlyOrdersRunRate,
    monthly_sessions_run_rate: monthlySessionsRunRate,
    forecast_goal_gmv: forecastGoalGmv,
  };
}

function inclusiveDays(start, end) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);
}

function clampInclusiveDays(start, current, end) {
  if (current < start) return 0;
  const realEnd = current > end ? end : current;
  return inclusiveDays(start, realEnd);
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${trimSlash(process.env.SUPABASE_URL)}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error("Supabase request failed");
    error.statusCode = response.status;
    error.details = body;
    throw error;
  }

  return body || [];
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

function number(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
