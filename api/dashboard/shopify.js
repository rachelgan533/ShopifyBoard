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
      customerRows,
      behaviorRows,
      previousBehaviorRows,
      ga4Rows,
      previousGa4Rows,
      trafficRows,
      previousTrafficRows,
      searchConsoleRows,
      previousSearchConsoleRows,
      adRows,
      previousAdRows,
      goalRows,
      syncRows,
      integrationRows,
      audienceRows,
    ] = await Promise.all([
      supabaseFetch(
        `/rest/v1/orders?select=id,customer_id,total_price,subtotal_price,total_refunded,created_at,source_name,customer_country,customer_province,customer_city,discount_codes,landing_site,referring_site,raw&created_at=gte.${encodeURIComponent(range.startIso)}&created_at=lte.${encodeURIComponent(range.endIso)}&limit=20000`,
      ),
      supabaseFetch(
        `/rest/v1/orders?select=id,customer_id,total_price,subtotal_price,total_refunded,created_at,source_name,customer_country,customer_province,customer_city,discount_codes,landing_site,referring_site,raw&created_at=gte.${encodeURIComponent(previousRange.startIso)}&created_at=lte.${encodeURIComponent(previousRange.endIso)}&limit=20000`,
      ),
      supabaseFetch("/rest/v1/order_line_items?select=order_id,title,sku,quantity,price&limit=30000"),
      supabaseFetch("/rest/v1/coupon_codes?select=code,category,owner,status&limit=10000"),
      supabaseFetch("/rest/v1/customers?select=id,email,first_name,last_name,last_order_at&limit=20000"),
      safeSupabaseFetch(
        `/rest/v1/user_behavior_events?select=event_time,event_name,session_id,user_pseudo_id,customer_id,page_url,page_type,channel_primary,product_id,search_term,value,currency,properties&event_time=gte.${encodeURIComponent(range.startIso)}&event_time=lte.${encodeURIComponent(range.endIso)}&limit=50000`,
        [],
      ),
      safeSupabaseFetch(
        `/rest/v1/user_behavior_events?select=event_time,event_name,session_id,user_pseudo_id,customer_id,page_url,page_type,channel_primary,product_id,search_term,value,currency,properties&event_time=gte.${encodeURIComponent(previousRange.startIso)}&event_time=lte.${encodeURIComponent(previousRange.endIso)}&limit=50000`,
        [],
      ),
      supabaseFetch(
        `/rest/v1/ga4_daily_metrics?select=day,sessions,users,add_to_carts,checkouts,purchases&day=gte.${range.start}&day=lte.${range.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/ga4_daily_metrics?select=day,sessions,users,add_to_carts,checkouts,purchases&day=gte.${previousRange.start}&day=lte.${previousRange.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/traffic_attribution_daily?select=day,channel_primary,channel_secondary,sessions,users,new_users,engaged_sessions,add_to_carts,checkouts,purchases,revenue,clicks,impressions,spend&source_system=eq.ga4&day=gte.${range.start}&day=lte.${range.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/traffic_attribution_daily?select=day,channel_primary,channel_secondary,sessions,users,new_users,engaged_sessions,add_to_carts,checkouts,purchases,revenue,clicks,impressions,spend&source_system=eq.ga4&day=gte.${previousRange.start}&day=lte.${previousRange.end}&limit=10000`,
      ),
      supabaseFetch(
        `/rest/v1/search_console_metrics?select=day,dimension_type,dimension_value,clicks,impressions,ctr,position&day=gte.${range.start}&day=lte.${range.end}&limit=30000`,
      ),
      supabaseFetch(
        `/rest/v1/search_console_metrics?select=day,dimension_type,dimension_value,clicks,impressions,ctr,position&day=gte.${previousRange.start}&day=lte.${previousRange.end}&limit=30000`,
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
      supabaseFetch(
        "/rest/v1/data_integrations?select=source,status,config,last_synced_at,last_tested_at&source=in.(shopify,ga4,google_ads,meta_ads)&limit=20",
      ),
      supabaseFetch(
        "/rest/v1/audience_segments?select=source,segment_type,segment_name,users,percentage,affinity,day&order=day.desc&limit=5000",
      ),
    ]);

    const orderIds = new Set(orderRows.map((row) => row.id));
    const filteredLineItems = lineItemRows.filter((row) => orderIds.has(row.order_id));

    const summary = summarizeOrders(orderRows);
    const dailySales = buildDailySales(orderRows);
    const topProducts = buildTopProducts(filteredLineItems);
    const countrySales = buildCountrySales(orderRows);
    const provinceSales = buildProvinceSales(orderRows);
    const customerSegments = buildCustomerSegments(orderRows);
    const customerQuality = buildCustomerQuality(orderRows);
    const topCustomers = buildTopCustomers(orderRows, customerRows);
    const orderMix = buildOrderMix(orderRows);
    const previousSummary = summarizeOrders(previousOrderRows);
    const previousCustomerQuality = buildCustomerQuality(previousOrderRows);
    const behavior = buildBehaviorData(behaviorRows);
    const previousBehavior = buildBehaviorData(previousBehaviorRows);
    const couponUsage = buildCouponUsage(orderRows, couponRows);
    const customerCouponSegments = buildCustomerCouponSegments(orderRows, couponRows);
    const customerChannelQuality = buildCustomerChannelQuality(orderRows);
    const previousCustomerCouponSegments = buildCustomerCouponSegments(previousOrderRows, couponRows);
    const referral = buildReferralData(orderRows, couponRows);
    const previousReferral = buildReferralData(previousOrderRows, couponRows);
    const channelSales = buildChannelSales(orderRows);
    const trafficAttribution = buildTrafficAttributionData(trafficRows);
    const searchConsole = buildSearchConsoleAttributionData(searchConsoleRows);
    const attribution = buildAttributionData(orderRows, couponRows);
    const attributionComparison = buildAttributionComparison(trafficAttribution, attribution);
    const previousTrafficAttribution = buildTrafficAttributionData(previousTrafficRows);
    const previousSearchConsole = buildSearchConsoleAttributionData(previousSearchConsoleRows);
    const previousAttribution = buildAttributionData(previousOrderRows, couponRows);
    const ga4Funnel = buildGa4Funnel(ga4Rows);
    const previousGa4Funnel = buildGa4Funnel(previousGa4Rows);
    const ga4Daily = buildGa4Daily(ga4Rows);
    const adPerformance = buildAdPerformance(adRows);
    const previousAdPerformance = buildAdPerformance(previousAdRows);
    const adDaily = buildAdDaily(adRows);
    const sync = buildSyncSummary(syncRows, integrationRows);
    const activeGoal = await buildActiveGoal(goalRows[0], range, summary, ga4Funnel);
    const audience = buildAudienceOverview(audienceRows);
    const shopifyPersona = buildShopifyPersona(orderRows, customerQuality.summary, summary, customerSegments);

    return res.status(200).json({
      ok: true,
      range,
      summary,
      daily_sales: dailySales,
      top_products: topProducts,
      country_sales: countrySales,
      province_sales: provinceSales,
      customer_segments: customerSegments,
      customer_coupon_segments: customerCouponSegments,
      customer_channel_quality: customerChannelQuality,
      customer_quality: customerQuality.summary,
      customer_daily: customerQuality.daily,
      top_customers: topCustomers,
      order_mix: orderMix,
      coupon_usage: couponUsage,
      behavior,
      referral,
      channel_sales: channelSales,
      traffic_attribution: trafficAttribution,
      search_console: searchConsole,
      attribution,
      attribution_comparison: attributionComparison,
      ga4_funnel: ga4Funnel,
      ga4_daily: ga4Daily,
      ad_performance: adPerformance,
      ad_daily: adDaily,
      audience,
      shopify_persona: shopifyPersona,
      previous: {
        range: previousRange,
        summary: previousSummary,
        behavior: previousBehavior,
        customer_coupon_segments: previousCustomerCouponSegments,
        customer_quality: previousCustomerQuality.summary,
        referral: previousReferral,
        traffic_attribution: previousTrafficAttribution,
        search_console: previousSearchConsole,
        attribution: previousAttribution,
        ga4_funnel: previousGa4Funnel,
        ad_performance: previousAdPerformance,
        behavior: previousBehavior,
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

function buildAudienceOverview(rows) {
  const bySource = groupLatestAudienceBySource(rows);
  const overviewRows = ["ga4", "google_ads", "meta_ads"].flatMap((source) => bySource[source]?.rows || []);

  return {
    overview: buildAudienceSnapshot(overviewRows),
    sources: {
      ga4: buildAudienceSnapshot(bySource.ga4?.rows || []),
      google_ads: buildAudienceSnapshot(bySource.google_ads?.rows || []),
      meta_ads: buildAudienceSnapshot(bySource.meta_ads?.rows || []),
    },
  };
}

function groupLatestAudienceBySource(rows) {
  const latestBySource = {};
  rows.forEach((row) => {
    const source = row.source || "unknown";
    if (!latestBySource[source] || String(row.day || "") > latestBySource[source]) {
      latestBySource[source] = String(row.day || "");
    }
  });

  const grouped = {};
  rows.forEach((row) => {
    const source = row.source || "unknown";
    if (String(row.day || "") !== latestBySource[source]) return;
    if (!grouped[source]) grouped[source] = { latest_day: latestBySource[source], rows: [] };
    grouped[source].rows.push(row);
  });
  return grouped;
}

function buildAudienceSnapshot(rows) {
  if (!rows.length) {
    return {
      latest_day: null,
      gender: [],
      age: [],
      interest: [],
      language: [],
      country: [],
      city: [],
      device: [],
    };
  }

  const byType = rows.reduce((acc, row) => {
    const type = row.segment_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(row);
    return acc;
  }, {});

  return {
    latest_day: rows[0]?.day || null,
    gender: normalizeAudienceType(byType.gender || []),
    age: normalizeAudienceType(byType.age || []),
    interest: normalizeAudienceType(byType.interest || [], true),
    language: normalizeAudienceType(byType.language || []),
    country: normalizeAudienceType(byType.country || []),
    city: normalizeAudienceType(byType.city || []),
    device: normalizeAudienceType(byType.device || []),
    channel: normalizeAudienceType(byType.channel || []),
  };
}

function normalizeAudienceType(rows, useAffinity = false) {
  const total = rows.reduce((sum, row) => sum + number(row.users), 0) || 1;
  return rows
    .map((row) => ({
      name: row.segment_name,
      users: number(row.users),
      percentage: round(row.percentage ? number(row.percentage) : (number(row.users) / total) * 100),
      affinity: useAffinity ? round(row.affinity || row.users) : null,
    }))
    .sort((a, b) => b.users - a.users);
}

function buildShopifyPersona(rows, customerSummary, orderSummary, customerSegments) {
  return {
    country: buildLocationDistribution(rows, "customer_country"),
    province: buildLocationDistribution(rows, "customer_province"),
    city: buildLocationDistribution(rows, "customer_city"),
    new_vs_returning: [
      { name: "New Customers", value: Math.max(number(customerSummary.new_customers), 0) },
      { name: "Returning Customers", value: Math.max(number(customerSummary.returning_customers), 0) },
    ],
    value_segments: customerSegments.map((segment) => ({
      name: segment.segment,
      customers: segment.customers,
      revenue: segment.revenue,
      aov: segment.avg_customer_value,
    })),
    metrics: {
      aov: number(orderSummary.aov),
      ltv: number(customerSummary.avg_customer_value),
      repeat_rate: number(customerSummary.repeat_rate),
      orders: number(orderSummary.orders),
    },
  };
}

function buildBehaviorData(rows) {
  const safeRows = (rows || [])
    .map((row) => ({
      ...row,
      day: String(row.event_time || "").slice(0, 10),
    }))
    .filter((row) => row.day);

  const sessionMap = new Map();
  const pageMap = new Map();
  const channelMap = new Map();
  const dailyMap = new Map();
  const eventCounts = new Map();
  const searchTerms = new Map();

  safeRows.forEach((row) => {
    const eventName = String(row.event_name || "").trim();
    const sessionId = String(row.session_id || "").trim() || `anon:${row.user_pseudo_id || row.customer_id || row.day}`;
    const channel = String(row.channel_primary || "").trim() || "unknown";
    const pageKey = `${row.page_url || "(unknown)"}::${row.page_type || "other"}`;
    const properties = normalizeJsonObject(row.properties);

    eventCounts.set(eventName, (eventCounts.get(eventName) || 0) + 1);

    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        session_id: sessionId,
        day: row.day,
        channel,
        user_pseudo_id: row.user_pseudo_id || "",
        customer_id: row.customer_id || "",
        events: [],
        pages: new Set(),
      });
    }

    const session = sessionMap.get(sessionId);
    session.events.push({
      event_name: eventName,
      page_type: row.page_type || "other",
      page_url: row.page_url || "",
      product_id: row.product_id || "",
      search_term: row.search_term || "",
      value: number(row.value),
      currency: row.currency || "USD",
      properties,
      event_time: row.event_time || "",
    });
    if (row.page_url) session.pages.add(row.page_url);

    if (!pageMap.has(pageKey)) {
      pageMap.set(pageKey, {
        page_url: row.page_url || "(unknown)",
        page_type: row.page_type || "other",
        page_views: 0,
        product_views: 0,
        add_to_carts: 0,
        purchases: 0,
      });
    }

    const pageRow = pageMap.get(pageKey);
    if (eventName === "page_view") pageRow.page_views += 1;
    if (eventName === "view_item") pageRow.product_views += 1;
    if (eventName === "add_to_cart") pageRow.add_to_carts += 1;
    if (eventName === "purchase") pageRow.purchases += 1;

    if (!channelMap.has(channel)) {
      channelMap.set(channel, {
        channel,
        sessions: new Set(),
        users: new Set(),
        add_to_carts: 0,
        checkouts: 0,
        purchases: 0,
      });
    }
    const channelRow = channelMap.get(channel);
    channelRow.sessions.add(sessionId);
    if (row.user_pseudo_id) channelRow.users.add(row.user_pseudo_id);
    if (eventName === "add_to_cart") channelRow.add_to_carts += 1;
    if (eventName === "begin_checkout") channelRow.checkouts += 1;
    if (eventName === "purchase") channelRow.purchases += 1;

    if (!dailyMap.has(row.day)) {
      dailyMap.set(row.day, {
        day: row.day,
        page_view: 0,
        view_item: 0,
        add_to_cart: 0,
        begin_checkout: 0,
        purchase: 0,
      });
    }
    const dayRow = dailyMap.get(row.day);
    if (dayRow[eventName] !== undefined) dayRow[eventName] += 1;

    if (eventName === "site_search" && row.search_term) {
      searchTerms.set(row.search_term, (searchTerms.get(row.search_term) || 0) + 1);
    }
  });

  const sessions = Array.from(sessionMap.values());
  const sessionCount = sessions.length;
  const users = new Set(sessions.map((row) => row.user_pseudo_id).filter(Boolean)).size;
  const productViews = eventCounts.get("view_item") || 0;
  const addToCarts = eventCounts.get("add_to_cart") || 0;
  const checkouts = eventCounts.get("begin_checkout") || 0;
  const purchases = eventCounts.get("purchase") || 0;
  const pageViews = eventCounts.get("page_view") || 0;

  const topPaths = Array.from(
    sessions.reduce((acc, session) => {
      const ordered = session.events
        .slice()
        .sort((a, b) => String(a.event_time).localeCompare(String(b.event_time)))
        .map((event) => event.event_name)
        .filter(Boolean)
        .slice(0, 6);
      if (!ordered.length) return acc;
      const key = ordered.join(" -> ");
      const current = acc.get(key) || { path: key, sessions: 0 };
      current.sessions += 1;
      acc.set(key, current);
      return acc;
    }, new Map()).values(),
  )
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  const pages = Array.from(pageMap.values())
    .map((row) => ({
      ...row,
      add_to_cart_rate: round(row.page_views ? (row.add_to_carts / row.page_views) * 100 : 0),
      purchase_rate: round(row.page_views ? (row.purchases / row.page_views) * 100 : 0),
    }))
    .sort((a, b) => b.page_views - a.page_views || b.add_to_carts - a.add_to_carts)
    .slice(0, 12);

  const channels = Array.from(channelMap.values())
    .map((row) => ({
      channel: row.channel,
      sessions: row.sessions.size,
      users: row.users.size,
      add_to_carts: row.add_to_carts,
      checkouts: row.checkouts,
      purchases: row.purchases,
      purchase_rate: round(row.sessions.size ? (row.purchases / row.sessions.size) * 100 : 0),
      add_to_cart_rate: round(row.sessions.size ? (row.add_to_carts / row.sessions.size) * 100 : 0),
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 12);

  const topSearchTerms = Array.from(searchTerms.entries())
    .map(([term, count]) => ({ term, searches: count }))
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 10);
  const impact = buildBehaviorImpact(sessions);
  const modules = buildModuleImpact(sessions);

  return {
    summary: {
      sessions: sessionCount,
      users,
      page_views: pageViews,
      pages_per_session: round(sessionCount ? pageViews / sessionCount : 0),
      product_views: productViews,
      add_to_carts: addToCarts,
      checkouts,
      purchases,
      add_to_cart_rate: round(sessionCount ? (addToCarts / sessionCount) * 100 : 0),
      checkout_rate: round(sessionCount ? (checkouts / sessionCount) * 100 : 0),
      purchase_rate: round(sessionCount ? (purchases / sessionCount) * 100 : 0),
    },
    funnel: {
      landing_views: pageViews,
      list_views: eventCounts.get("view_item_list") || 0,
      product_views: productViews,
      add_to_carts: addToCarts,
      cart_views: eventCounts.get("view_cart") || 0,
      begin_checkout: checkouts,
      purchases,
    },
    pages,
    channels,
    top_paths: topPaths,
    top_search_terms: topSearchTerms,
    impact,
    modules,
    daily: Array.from(dailyMap.values()).sort((a, b) => a.day.localeCompare(b.day)),
  };
}

function buildModuleImpact(sessions) {
  const sessionFacts = sessions.map((session) => {
    const events = session.events || [];
    const eventNames = new Set(events.map((event) => event.event_name).filter(Boolean));
    const converted = eventNames.has("purchase");
    const revenue = events
      .filter((event) => event.event_name === "purchase")
      .reduce((sum, event) => sum + number(event.value), 0);
    const modules = new Map();

    events.forEach((event) => {
      const moduleMeta = readEventModule(event);
      if (!moduleMeta.id) return;
      const current = modules.get(moduleMeta.id) || {
        ...moduleMeta,
        exposed: false,
        interacted: false,
        submitted: false,
        events: 0,
      };
      current.exposed = current.exposed || isModuleExposureEvent(event.event_name);
      current.interacted = current.interacted || isModuleInteractionEvent(event.event_name);
      current.submitted = current.submitted || event.event_name === "module_submit";
      current.events += 1;
      modules.set(moduleMeta.id, current);
    });

    return { modules, converted, revenue };
  });

  const moduleMap = new Map();
  sessionFacts.forEach((session) => {
    session.modules.forEach((module) => {
      if (!moduleMap.has(module.id)) {
        moduleMap.set(module.id, {
          module_id: module.id,
          module_name: module.name,
          module_type: module.type,
          module_position: module.position,
          module_variant: module.variant,
          exposed_sessions: 0,
          interacted_sessions: 0,
          submitted_sessions: 0,
          converted_sessions: 0,
          revenue: 0,
        });
      }
      const row = moduleMap.get(module.id);
      row.exposed_sessions += 1;
      if (module.interacted) row.interacted_sessions += 1;
      if (module.submitted) row.submitted_sessions += 1;
      if (session.converted) row.converted_sessions += 1;
      row.revenue += number(session.revenue);
    });
  });

  return Array.from(moduleMap.values())
    .map((row) => {
      const unexposed = sessionFacts.filter((session) => !session.modules.has(row.module_id));
      const baseline = summarizeBehaviorImpactBucket(unexposed);
      const conversionRate = round(row.exposed_sessions ? (row.converted_sessions / row.exposed_sessions) * 100 : 0);
      const revenue = round(row.revenue);
      return {
        ...row,
        revenue,
        interaction_rate: round(row.exposed_sessions ? (row.interacted_sessions / row.exposed_sessions) * 100 : 0),
        conversion_rate: conversionRate,
        revenue_per_session: round(row.exposed_sessions ? revenue / row.exposed_sessions : 0),
        baseline_sessions: baseline.sessions,
        baseline_conversion_rate: baseline.conversion_rate,
        baseline_revenue_per_session: baseline.revenue_per_session,
        uplift_pp: round(conversionRate - baseline.conversion_rate),
        relative_uplift: round(
          baseline.conversion_rate
            ? ((conversionRate - baseline.conversion_rate) / baseline.conversion_rate) * 100
            : conversionRate > 0
              ? 100
              : 0,
        ),
      };
    })
    .sort((a, b) => Math.abs(b.uplift_pp) - Math.abs(a.uplift_pp) || b.exposed_sessions - a.exposed_sessions)
    .slice(0, 16);
}

function readEventModule(event) {
  const properties = normalizeJsonObject(event.properties);
  const moduleId = trimText(properties.module_id || properties.element_name || properties.section_name);
  if (!moduleId && !isModuleEvent(event.event_name)) return {};
  const fallbackId = moduleId || `${event.page_type || "page"}:${event.event_name}`;
  return {
    id: fallbackId,
    name: trimText(properties.module_name || properties.section_name || properties.element_name || fallbackId),
    type: trimText(properties.module_type || inferModuleType(event.event_name, fallbackId)),
    position: trimText(properties.module_position || event.page_type || "unknown"),
    variant: trimText(properties.module_variant || properties.variant_name || properties.experiment_id || ""),
  };
}

function isModuleEvent(eventName) {
  return /^module_/.test(String(eventName || ""));
}

function isModuleExposureEvent(eventName) {
  return ["module_view", "module_click", "module_expand", "module_submit"].includes(String(eventName || ""));
}

function isModuleInteractionEvent(eventName) {
  return ["module_click", "module_expand", "module_submit"].includes(String(eventName || ""));
}

function inferModuleType(eventName, moduleId) {
  const text = `${eventName || ""} ${moduleId || ""}`.toLowerCase();
  if (text.includes("review")) return "review";
  if (text.includes("faq")) return "faq";
  if (text.includes("shipping")) return "shipping";
  if (text.includes("search")) return "search";
  if (text.includes("coupon")) return "coupon";
  if (text.includes("bundle") || text.includes("upsell")) return "upsell";
  return "module";
}

function buildBehaviorImpact(sessions) {
  const definitions = [
    { event_name: "review_opened", label: "看评论" },
    { event_name: "site_search", label: "站内搜索" },
    { event_name: "shipping_info_opened", label: "查看配送信息" },
    { event_name: "faq_opened", label: "查看 FAQ" },
    { event_name: "wishlist_added", label: "加入愿望单" },
    { event_name: "coupon_attempted", label: "尝试优惠码" },
  ];

  const sessionFacts = sessions.map((session) => {
    const events = session.events || [];
    const eventNames = new Set(events.map((event) => event.event_name).filter(Boolean));
    const converted = eventNames.has("purchase");
    const revenue = events
      .filter((event) => event.event_name === "purchase")
      .reduce((sum, event) => sum + number(event.value), 0);
    return { eventNames, converted, revenue };
  });

  return definitions
    .map((definition) => {
      const exposed = sessionFacts.filter((session) => session.eventNames.has(definition.event_name));
      const unexposed = sessionFacts.filter((session) => !session.eventNames.has(definition.event_name));
      const exposedMetrics = summarizeBehaviorImpactBucket(exposed);
      const baselineMetrics = summarizeBehaviorImpactBucket(unexposed);
      return {
        event_name: definition.event_name,
        label: definition.label,
        sessions: exposedMetrics.sessions,
        converted_sessions: exposedMetrics.converted_sessions,
        conversion_rate: exposedMetrics.conversion_rate,
        revenue: exposedMetrics.revenue,
        revenue_per_session: exposedMetrics.revenue_per_session,
        baseline_sessions: baselineMetrics.sessions,
        baseline_converted_sessions: baselineMetrics.converted_sessions,
        baseline_conversion_rate: baselineMetrics.conversion_rate,
        baseline_revenue_per_session: baselineMetrics.revenue_per_session,
        uplift_pp: round(exposedMetrics.conversion_rate - baselineMetrics.conversion_rate),
        relative_uplift: round(
          baselineMetrics.conversion_rate
            ? ((exposedMetrics.conversion_rate - baselineMetrics.conversion_rate) / baselineMetrics.conversion_rate) * 100
            : exposedMetrics.conversion_rate > 0
              ? 100
              : 0,
        ),
      };
    })
    .filter((row) => row.sessions > 0 || row.baseline_sessions > 0)
    .sort((a, b) => Math.abs(b.uplift_pp) - Math.abs(a.uplift_pp));
}

function summarizeBehaviorImpactBucket(sessions) {
  const sessionCount = sessions.length;
  const convertedSessions = sessions.filter((session) => session.converted).length;
  const revenue = sessions.reduce((sum, session) => sum + number(session.revenue), 0);
  return {
    sessions: sessionCount,
    converted_sessions: convertedSessions,
    conversion_rate: round(sessionCount ? (convertedSessions / sessionCount) * 100 : 0),
    revenue: round(revenue),
    revenue_per_session: round(sessionCount ? revenue / sessionCount : 0),
  };
}

function buildLocationDistribution(rows, field) {
  const grouped = new Map();
  const allCustomers = new Set();
  rows.forEach((row) => {
    const value = String(row[field] || "").trim();
    if (!value || !row.customer_id) return;
    allCustomers.add(row.customer_id);
    if (!grouped.has(value)) grouped.set(value, new Set());
    grouped.get(value).add(row.customer_id);
  });
  const total = allCustomers.size || 1;
  return Array.from(grouped.entries())
    .map(([name, ids]) => ({
      name,
      users: ids.size,
      percentage: round((ids.size / total) * 100),
    }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 12);
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

function buildProvinceSales(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = String(row.customer_province || "").trim();
    if (!key) return;
    if (!grouped.has(key)) {
      grouped.set(key, { province: key, orders: 0, customers: new Set(), revenue: 0 });
    }
    const item = grouped.get(key);
    item.orders += 1;
    item.revenue += number(row.total_price);
    if (row.customer_id) item.customers.add(row.customer_id);
  });

  const totalOrders = Array.from(grouped.values()).reduce((sum, item) => sum + item.orders, 0) || 1;
  return Array.from(grouped.values())
    .map((item) => ({
      province: item.province,
      orders: item.orders,
      customers: item.customers.size,
      revenue: round(item.revenue),
      aov: round(item.orders ? item.revenue / item.orders : 0),
      order_share: round((item.orders / totalOrders) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);
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

function buildTopCustomers(orderRows, customerRows) {
  const customerMap = new Map(
    (customerRows || []).map((row) => [
      row.id,
      {
        email: row.email || "—",
        name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Guest",
        last_order_at: row.last_order_at || null,
      },
    ]),
  );

  const grouped = new Map();
  orderRows.forEach((row) => {
    if (!row.customer_id) return;
    if (!grouped.has(row.customer_id)) {
      grouped.set(row.customer_id, { customer_id: row.customer_id, orders: 0, revenue: 0, last_order_at: row.created_at || null });
    }
    const item = grouped.get(row.customer_id);
    item.orders += 1;
    item.revenue += number(row.total_price);
    if (row.created_at && (!item.last_order_at || String(row.created_at) > String(item.last_order_at))) {
      item.last_order_at = row.created_at;
    }
  });

  return Array.from(grouped.values())
    .map((item) => {
      const profile = customerMap.get(item.customer_id) || {};
      return {
        customer_id: item.customer_id,
        name: profile.name || "Guest",
        email: profile.email || "—",
        orders: item.orders,
        revenue: round(item.revenue),
        ltv: round(item.revenue),
        last_order_at: profile.last_order_at || item.last_order_at,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function buildOrderMix(rows) {
  const total = rows.length || 1;
  let b2b = 0;
  rows.forEach((row) => {
    const source = String(row.source_name || "").toLowerCase();
    if (source.includes("b2b") || source.includes("wholesale") || source.includes("draft_order")) {
      b2b += 1;
    }
  });
  const regular = Math.max(rows.length - b2b, 0);
  return [
    { name: "普通", orders: regular, percentage: round((regular / total) * 100) },
    { name: "B2B", orders: b2b, percentage: round((b2b / total) * 100) },
  ];
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

function buildCustomerCouponSegments(orderRows, couponRows) {
  const codeToCategory = new Map();
  couponRows.forEach((row) => {
    const code = String(row.code || "").trim();
    if (!code) return;
    codeToCategory.set(code, row.category || "其他券");
  });

  const byCustomer = new Map();
  orderRows.forEach((row) => {
    if (!row.customer_id) return;
    if (!byCustomer.has(row.customer_id)) {
      byCustomer.set(row.customer_id, new Map());
    }
    const bucket = byCustomer.get(row.customer_id);
    const codes = Array.isArray(row.discount_codes) ? row.discount_codes : [];
    const categories = new Set(
      (codes.length ? codes : ["未用券"])
        .map((code) => (code === "未用券" ? code : codeToCategory.get(String(code || "").trim()) || "其他券"))
        .filter(Boolean),
    );

    categories.forEach((category) => {
      bucket.set(category, (bucket.get(category) || 0) + 1);
    });
  });

  const grouped = new Map();
  byCustomer.forEach((categoryCounts) => {
    const dominant = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "未用券";
    grouped.set(dominant, (grouped.get(dominant) || 0) + 1);
  });

  const total = Array.from(grouped.values()).reduce((sum, count) => sum + count, 0) || 1;
  return Array.from(grouped.entries())
    .map(([category, customers]) => ({
      category,
      customers,
      percentage: round((customers / total) * 100),
    }))
    .sort((a, b) => b.customers - a.customers);
}

function buildReferralData(orderRows, couponRows) {
  const codeMap = new Map();
  couponRows.forEach((row) => {
    const code = String(row.code || "").trim();
    if (!code) return;
    codeMap.set(code, {
      category: row.category || "其他券",
      owner: String(row.owner || "").trim(),
      status: row.status || "启用",
    });
  });

  const summary = {
    affiliate_orders: 0,
    affiliate_revenue: 0,
    influencer_coupon_orders: 0,
    influencer_coupon_revenue: 0,
  };
  const byOwner = new Map();
  const daily = new Map();

  orderRows.forEach((row) => {
    const codes = Array.isArray(row.discount_codes) ? row.discount_codes : [];
    const affiliateCode = codes
      .map((code) => ({ code: String(code || "").trim(), meta: codeMap.get(String(code || "").trim()) }))
      .find((item) => item.code && item.meta?.category === "达人券");

    if (!affiliateCode) return;

    const total = number(row.total_price);
    summary.affiliate_orders += 1;
    summary.affiliate_revenue += total;
    summary.influencer_coupon_orders += 1;
    summary.influencer_coupon_revenue += total;

    const owner = affiliateCode.meta.owner || affiliateCode.code || "未归属达人";
    if (!byOwner.has(owner)) {
      byOwner.set(owner, { owner, orders: 0, revenue: 0 });
    }
    const bucket = byOwner.get(owner);
    bucket.orders += 1;
    bucket.revenue += total;

    const day = toDateOnly(row.created_at || new Date());
    if (!daily.has(day)) {
      daily.set(day, { day, orders: 0, revenue: 0 });
    }
    const dayBucket = daily.get(day);
    dayBucket.orders += 1;
    dayBucket.revenue += total;
  });

  const totalOrders = orderRows.length || 1;
  const top_referrers = Array.from(byOwner.values())
    .map((item) => ({
      owner: item.owner,
      orders: item.orders,
      revenue: round(item.revenue),
      order_share: round((item.orders / totalOrders) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    affiliate_orders: summary.affiliate_orders,
    affiliate_revenue: round(summary.affiliate_revenue),
    affiliate_order_share: round((summary.affiliate_orders / totalOrders) * 100),
    influencer_coupon_orders: summary.influencer_coupon_orders,
    influencer_coupon_revenue: round(summary.influencer_coupon_revenue),
    top_referrers,
    daily: Array.from(daily.values())
      .map((item) => ({
        day: item.day,
        orders: item.orders,
        revenue: round(item.revenue),
      }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
}

function buildCustomerChannelQuality(orderRows) {
  const ordersByCustomer = new Map();
  orderRows.forEach((row) => {
    if (!row.customer_id) return;
    ordersByCustomer.set(row.customer_id, (ordersByCustomer.get(row.customer_id) || 0) + 1);
  });

  const grouped = new Map();
  orderRows.forEach((row) => {
    const channel = String(row.source_name || "Direct").trim() || "Direct";
    if (!grouped.has(channel)) {
      grouped.set(channel, {
        channel,
        customers: new Set(),
        repeat_customers: new Set(),
        revenue: 0,
      });
    }
    const bucket = grouped.get(channel);
    if (row.customer_id) {
      bucket.customers.add(row.customer_id);
      if ((ordersByCustomer.get(row.customer_id) || 0) > 1) {
        bucket.repeat_customers.add(row.customer_id);
      }
    }
    bucket.revenue += number(row.total_price);
  });

  return Array.from(grouped.values())
    .map((row) => ({
      channel: row.channel,
      customers: row.customers.size,
      repeat_customers: row.repeat_customers.size,
      repeat_rate: round(row.customers.size ? (row.repeat_customers.size / row.customers.size) * 100 : 0),
      revenue: round(row.revenue),
    }))
    .sort((a, b) => b.customers - a.customers)
    .slice(0, 8);
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

function buildTrafficAttributionData(rows) {
  const channelBuckets = new Map();
  const daily = new Map();
  const summary = {
    sessions: 0,
    users: 0,
    new_users: 0,
    engaged_sessions: 0,
    add_to_carts: 0,
    checkouts: 0,
    purchases: 0,
  };

  rows.forEach((row) => {
    const channel = String(row.channel_primary || "unknown").trim() || "unknown";
    const subchannel = String(row.channel_secondary || "—").trim() || "—";
    const key = `${channel}::${subchannel}`;
    if (!channelBuckets.has(key)) {
      channelBuckets.set(key, {
        channel,
        subchannel,
        sessions: 0,
        users: 0,
        new_users: 0,
        engaged_sessions: 0,
        add_to_carts: 0,
        checkouts: 0,
        purchases: 0,
      });
    }
    const bucket = channelBuckets.get(key);
    bucket.sessions += number(row.sessions);
    bucket.users += number(row.users);
    bucket.new_users += number(row.new_users);
    bucket.engaged_sessions += number(row.engaged_sessions);
    bucket.add_to_carts += number(row.add_to_carts);
    bucket.checkouts += number(row.checkouts);
    bucket.purchases += number(row.purchases);

    summary.sessions += number(row.sessions);
    summary.users += number(row.users);
    summary.new_users += number(row.new_users);
    summary.engaged_sessions += number(row.engaged_sessions);
    summary.add_to_carts += number(row.add_to_carts);
    summary.checkouts += number(row.checkouts);
    summary.purchases += number(row.purchases);

    const day = String(row.day || "").trim();
    if (!day) return;
    if (!daily.has(day)) {
      daily.set(day, {
        day,
        sessions_total: 0,
        users_total: 0,
        new_users_total: 0,
        engaged_sessions_total: 0,
        add_to_carts_total: 0,
        checkouts_total: 0,
        purchases_total: 0,
        direct: 0,
        organic: 0,
        ads: 0,
        edm: 0,
        community: 0,
        sns: 0,
        pr: 0,
        kol: 0,
        affiliate: 0,
        unknown: 0,
        other: 0,
      });
    }
    const dayBucket = daily.get(day);
    dayBucket.sessions_total += number(row.sessions);
    dayBucket.users_total += number(row.users);
    dayBucket.new_users_total += number(row.new_users);
    dayBucket.engaged_sessions_total += number(row.engaged_sessions);
    dayBucket.add_to_carts_total += number(row.add_to_carts);
    dayBucket.checkouts_total += number(row.checkouts);
    dayBucket.purchases_total += number(row.purchases);
    if (Object.prototype.hasOwnProperty.call(dayBucket, channel)) dayBucket[channel] += number(row.sessions);
    else dayBucket.other += number(row.sessions);
  });

  const totalSessions = summary.sessions || 1;
  const channels = Array.from(channelBuckets.values())
    .map((row) => ({
      channel: row.channel,
      subchannel: row.subchannel,
      sessions: row.sessions,
      users: row.users,
      new_users: row.new_users,
      engaged_sessions: row.engaged_sessions,
      add_to_carts: row.add_to_carts,
      checkouts: row.checkouts,
      purchases: row.purchases,
      session_share: round((row.sessions / totalSessions) * 100),
      cvr: round(row.sessions ? (row.purchases / row.sessions) * 100 : 0),
      add_to_cart_rate: round(row.sessions ? (row.add_to_carts / row.sessions) * 100 : 0),
      checkout_rate: round(row.sessions ? (row.checkouts / row.sessions) * 100 : 0),
    }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    summary: {
      sessions: summary.sessions,
      users: summary.users,
      new_users: summary.new_users,
      engaged_sessions: summary.engaged_sessions,
      add_to_carts: summary.add_to_carts,
      checkouts: summary.checkouts,
      purchases: summary.purchases,
      cvr: round(summary.sessions ? (summary.purchases / summary.sessions) * 100 : 0),
      add_to_cart_rate: round(summary.sessions ? (summary.add_to_carts / summary.sessions) * 100 : 0),
      checkout_rate: round(summary.sessions ? (summary.checkouts / summary.sessions) * 100 : 0),
    },
    channels,
    daily: Array.from(daily.values())
      .map((row) => ({
        ...row,
        cvr: round(row.sessions_total ? (row.purchases_total / row.sessions_total) * 100 : 0),
        add_to_cart_rate: round(row.sessions_total ? (row.add_to_carts_total / row.sessions_total) * 100 : 0),
        checkout_rate: round(row.sessions_total ? (row.checkouts_total / row.sessions_total) * 100 : 0),
      }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
}

function buildSearchConsoleAttributionData(rows) {
  const summaryRows = rows.filter((row) => row.dimension_type === "summary");
  const queryRows = rows.filter((row) => row.dimension_type === "query");
  const pageRows = rows.filter((row) => row.dimension_type === "page");
  const countryRows = rows.filter((row) => row.dimension_type === "country");
  const deviceRows = rows.filter((row) => row.dimension_type === "device");

  const summaryByDay = new Map();
  summaryRows.forEach((row) => {
    const day = String(row.day || "").trim();
    if (!day) return;
    if (!summaryByDay.has(day)) {
      summaryByDay.set(day, { day, clicks: 0, impressions: 0, weightedCtr: 0, weightedPosition: 0 });
    }
    const bucket = summaryByDay.get(day);
    const impressions = number(row.impressions);
    bucket.clicks += number(row.clicks);
    bucket.impressions += impressions;
    bucket.weightedCtr += number(row.ctr) * impressions;
    bucket.weightedPosition += number(row.position) * impressions;
  });

  const daily = Array.from(summaryByDay.values())
    .map((row) => ({
      day: row.day,
      clicks: round(row.clicks),
      impressions: round(row.impressions),
      ctr: round(row.impressions ? row.weightedCtr / row.impressions : 0),
      position: round(row.impressions ? row.weightedPosition / row.impressions : 0),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totals = daily.reduce(
    (acc, row) => {
      acc.clicks += number(row.clicks);
      acc.impressions += number(row.impressions);
      acc.weightedCtr += number(row.ctr) * number(row.impressions);
      acc.weightedPosition += number(row.position) * number(row.impressions);
      return acc;
    },
    { clicks: 0, impressions: 0, weightedCtr: 0, weightedPosition: 0 },
  );

  return {
    summary: {
      clicks: round(totals.clicks),
      impressions: round(totals.impressions),
      ctr: round(totals.impressions ? totals.weightedCtr / totals.impressions : 0),
      position: round(totals.impressions ? totals.weightedPosition / totals.impressions : 0),
    },
    daily,
    top_queries: aggregateSearchConsoleDimension(queryRows),
    top_pages: aggregateSearchConsoleDimension(pageRows),
    countries: aggregateSearchConsoleDimension(countryRows),
    devices: aggregateSearchConsoleDimension(deviceRows),
  };
}

function aggregateSearchConsoleDimension(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = String(row.dimension_value || "unknown").trim() || "unknown";
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: key,
        clicks: 0,
        impressions: 0,
        weightedCtr: 0,
        weightedPosition: 0,
      });
    }
    const bucket = grouped.get(key);
    const impressions = number(row.impressions);
    bucket.clicks += number(row.clicks);
    bucket.impressions += impressions;
    bucket.weightedCtr += number(row.ctr) * impressions;
    bucket.weightedPosition += number(row.position) * impressions;
  });

  return Array.from(grouped.values())
    .map((row) => ({
      name: row.name,
      clicks: round(row.clicks),
      impressions: round(row.impressions),
      ctr: round(row.impressions ? row.weightedCtr / row.impressions : 0),
      position: round(row.impressions ? row.weightedPosition / row.impressions : 0),
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12);
}

function buildAttributionComparison(trafficAttribution, orderAttribution) {
  const trafficChannels = trafficAttribution.channels || [];
  const orderChannels = orderAttribution.channels || [];
  const merged = new Map();

  trafficChannels.forEach((row) => {
    const key = row.channel;
    if (!merged.has(key)) merged.set(key, { channel: key });
    Object.assign(merged.get(key), {
      sessions: row.sessions,
      users: row.users,
      add_to_carts: row.add_to_carts,
      checkouts: row.checkouts,
      purchases: row.purchases,
      traffic_cvr: row.cvr,
      add_to_cart_rate: row.add_to_cart_rate,
      checkout_rate: row.checkout_rate,
    });
  });

  orderChannels.forEach((row) => {
    const key = row.channel;
    if (!merged.has(key)) merged.set(key, { channel: key });
    Object.assign(merged.get(key), {
      orders: row.orders,
      revenue: row.revenue,
      customers: row.customers,
      order_share: row.order_share,
      revenue_share: row.revenue_share,
      aov: row.aov,
    });
  });

  return Array.from(merged.values())
    .map((row) => {
      const sessions = number(row.sessions);
      const orders = number(row.orders);
      const revenue = number(row.revenue);
      return {
        channel: row.channel,
        sessions,
        users: number(row.users),
        add_to_carts: number(row.add_to_carts),
        checkouts: number(row.checkouts),
        traffic_purchases: number(row.purchases),
        orders,
        revenue: round(revenue),
        customers: number(row.customers),
        session_to_order_cvr: round(sessions ? (orders / sessions) * 100 : 0),
        revenue_per_session: round(sessions ? revenue / sessions : 0),
        traffic_cvr: round(row.traffic_cvr),
        add_to_cart_rate: round(row.add_to_cart_rate),
        checkout_rate: round(row.checkout_rate),
        aov: round(row.aov),
        session_share: round(
          (sessions / ((trafficAttribution.summary?.sessions || 0) || 1)) * 100,
        ),
        order_share: round(row.order_share),
        revenue_share: round(row.revenue_share),
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}

function buildAttributionData(orderRows, couponRows) {
  const couponMeta = new Map();
  couponRows.forEach((row) => {
    const code = String(row.code || "").trim();
    if (!code) return;
    couponMeta.set(code.toLowerCase(), {
      category: String(row.category || "").trim(),
      owner: String(row.owner || "").trim(),
    });
  });

  const channelBuckets = new Map();
  const kolBuckets = new Map();
  const affiliateBuckets = new Map();
  const daily = new Map();
  const summary = {
    orders: 0,
    attributed_orders: 0,
    revenue: 0,
    customers: new Set(),
    days_to_conversion_total: 0,
    days_to_conversion_count: 0,
  };
  const quality = {
    ready_orders: 0,
    pending_orders: 0,
    fallback_orders: 0,
    unknown_orders: 0,
  };

  orderRows.forEach((row) => {
    const snapshot = deriveOrderAttribution(row, couponMeta);
    const revenue = number(row.total_price);
    const customerId = row.customer_id || null;
    summary.orders += 1;
    summary.revenue += revenue;
    if (customerId) summary.customers.add(customerId);
    if (snapshot.days_to_conversion !== null && snapshot.days_to_conversion !== undefined) {
      summary.days_to_conversion_total += snapshot.days_to_conversion;
      summary.days_to_conversion_count += 1;
    }

    if (snapshot.ready) quality.ready_orders += 1;
    else quality.pending_orders += 1;
    if (snapshot.used_fallback) quality.fallback_orders += 1;
    if (snapshot.channel === "unknown") quality.unknown_orders += 1;
    else summary.attributed_orders += 1;

    const key = `${snapshot.channel}::${snapshot.subchannel || ""}`;
    if (!channelBuckets.has(key)) {
      channelBuckets.set(key, {
        channel: snapshot.channel,
        subchannel: snapshot.subchannel || "—",
        channel_rule: snapshot.channel_rule,
        orders: 0,
        revenue: 0,
        customers: new Set(),
      });
    }
    const bucket = channelBuckets.get(key);
    bucket.orders += 1;
    bucket.revenue += revenue;
    if (customerId) bucket.customers.add(customerId);

    const day = toDateOnly(row.created_at || new Date());
    if (!daily.has(day)) {
      daily.set(day, {
        day,
        orders_total: 0,
        revenue_total: 0,
        ready_orders: 0,
        direct: 0,
        organic: 0,
        ads: 0,
        edm: 0,
        community: 0,
        sns: 0,
        pr: 0,
        kol: 0,
        affiliate: 0,
        other: 0,
      });
    }
    const dayBucket = daily.get(day);
    dayBucket.orders_total += 1;
    dayBucket.revenue_total += revenue;
    if (snapshot.ready) dayBucket.ready_orders += 1;
    if (Object.prototype.hasOwnProperty.call(dayBucket, snapshot.channel)) {
      dayBucket[snapshot.channel] += 1;
    } else {
      dayBucket.other += 1;
    }

    if (snapshot.channel === "kol") {
      const owner = snapshot.owner || snapshot.referral_code || snapshot.utm_campaign || "未归属达人";
      if (!kolBuckets.has(owner)) kolBuckets.set(owner, { owner, orders: 0, revenue: 0 });
      const kol = kolBuckets.get(owner);
      kol.orders += 1;
      kol.revenue += revenue;
    }

    if (snapshot.channel === "affiliate") {
      const owner = snapshot.owner || snapshot.referral_code || snapshot.utm_source || "未归属联盟";
      if (!affiliateBuckets.has(owner)) affiliateBuckets.set(owner, { owner, orders: 0, revenue: 0 });
      const affiliate = affiliateBuckets.get(owner);
      affiliate.orders += 1;
      affiliate.revenue += revenue;
    }
  });

  const totalOrders = summary.orders || 1;
  const totalRevenue = summary.revenue || 1;

  const channels = Array.from(channelBuckets.values())
    .map((row) => ({
      channel: row.channel,
      subchannel: row.subchannel,
      channel_rule: row.channel_rule,
      orders: row.orders,
      revenue: round(row.revenue),
      customers: row.customers.size,
      aov: round(row.orders ? row.revenue / row.orders : 0),
      order_share: round((row.orders / totalOrders) * 100),
      revenue_share: round((row.revenue / totalRevenue) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    summary: {
      orders: summary.orders,
      attributed_orders: summary.attributed_orders,
      revenue: round(summary.revenue),
      customers: summary.customers.size,
      attributed_order_rate: round((summary.attributed_orders / totalOrders) * 100),
      avg_days_to_conversion: round(summary.days_to_conversion_count ? summary.days_to_conversion_total / summary.days_to_conversion_count : 0),
    },
    quality,
    channels,
    daily: Array.from(daily.values())
      .map((row) => ({
        ...row,
        revenue_total: round(row.revenue_total),
      }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    top_kol: finalizeAttributionOwners(kolBuckets, totalOrders),
    top_affiliate: finalizeAttributionOwners(affiliateBuckets, totalOrders),
  };
}

function finalizeAttributionOwners(map, totalOrders) {
  return Array.from(map.values())
    .map((row) => ({
      owner: row.owner,
      orders: row.orders,
      revenue: round(row.revenue),
      order_share: round((row.orders / (totalOrders || 1)) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function deriveOrderAttribution(row, couponMeta) {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {};
  const journey = raw.customerJourneySummary || {};
  const visit = journey.lastVisit || null;
  const utm = visit?.utmParameters || {};
  const rawCodes = Array.isArray(row.discount_codes) ? row.discount_codes : [];
  const discountCodes = rawCodes.map((code) => String(code || "").trim()).filter(Boolean);
  const matchedCoupon = discountCodes
    .map((code) => ({ code, meta: couponMeta.get(code.toLowerCase()) }))
    .find((item) => item.meta);

  const source = String(visit?.source || row.source_name || "").trim();
  const sourceDescription = String(visit?.sourceDescription || "").trim();
  const sourceType = String(visit?.sourceType || "").trim();
  const referrerUrl = String(visit?.referrerUrl || row.referring_site || "").trim();
  const landingPage = String(visit?.landingPage || row.landing_site || "").trim();
  const referralCode = String(visit?.referralCode || "").trim();
  const utmSource = String(utm.source || "").trim();
  const utmMedium = String(utm.medium || "").trim();
  const utmCampaign = String(utm.campaign || "").trim();
  const utmContent = String(utm.content || "").trim();
  const utmTerm = String(utm.term || "").trim();
  const owner = matchedCoupon?.meta?.owner || "";
  const category = matchedCoupon?.meta?.category || "";

  const classification = classifyAttribution({
    source,
    source_description: sourceDescription,
    source_type: sourceType,
    referrer_url: referrerUrl,
    landing_page: landingPage,
    referral_code: referralCode,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    discount_codes: discountCodes,
    coupon_category: category,
    coupon_owner: owner,
  });

  return {
    ready: Boolean(journey.ready),
    used_fallback: !visit,
    days_to_conversion: typeof journey.daysToConversion === "number" ? journey.daysToConversion : null,
    channel: classification.channel,
    subchannel: classification.subchannel,
    channel_rule: classification.rule,
    owner,
    referral_code: referralCode,
    utm_source: utmSource,
    utm_campaign: utmCampaign,
  };
}

function classifyAttribution(snapshot) {
  const source = String(snapshot.source || "").toLowerCase();
  const sourceDescription = String(snapshot.source_description || "").toLowerCase();
  const sourceType = String(snapshot.source_type || "").toLowerCase();
  const referrerUrl = String(snapshot.referrer_url || "").toLowerCase();
  const landingPage = String(snapshot.landing_page || "").toLowerCase();
  const utmSource = String(snapshot.utm_source || "").toLowerCase();
  const utmMedium = String(snapshot.utm_medium || "").toLowerCase();
  const utmCampaign = String(snapshot.utm_campaign || "").toLowerCase();
  const referralCode = String(snapshot.referral_code || "").toLowerCase();
  const couponCategory = String(snapshot.coupon_category || "").toLowerCase();
  const couponOwner = String(snapshot.coupon_owner || "").toLowerCase();
  const codePool = [...(snapshot.discount_codes || []).map((code) => String(code || "").toLowerCase()), referralCode].filter(Boolean);

  if (couponCategory.includes("联盟") || /(impact|shareasale|partnerize|rakuten|goaffpro|affiliate)/.test([utmSource, utmCampaign, source, sourceDescription, referrerUrl, couponOwner].join(" "))) {
    return { channel: "affiliate", subchannel: "affiliate_partner", rule: "affiliate_source_or_coupon" };
  }
  if (couponCategory.includes("达人") || /(influencer|creator|ambassador|kol)/.test([utmSource, utmCampaign, source, sourceDescription, couponOwner, ...codePool].join(" "))) {
    return { channel: "kol", subchannel: couponOwner || "influencer_coupon", rule: "kol_coupon_or_utm" };
  }
  if (
    /(cpc|ppc|paid_social|paidsearch|paid search|display|video|shopping|paid)/.test(utmMedium) ||
    /(google ads|meta ads|facebook ads|instagram ads|tiktok ads)/.test(sourceDescription) ||
    /(paid_search|paid_social)/.test(sourceType)
  ) {
    const subchannel =
      /(google|bing|search|shopping)/.test([utmSource, source, sourceDescription].join(" "))
        ? "paid_search"
        : "paid_social";
    return { channel: "ads", subchannel, rule: "paid_utm_or_source_type" };
  }
  if (/(email|newsletter|edm|klaviyo|mailchimp|shopify_email)/.test([utmMedium, utmSource, source, sourceDescription, referrerUrl].join(" "))) {
    return { channel: "edm", subchannel: utmSource || source || "email", rule: "email_source" };
  }
  if (/(prnewswire|forbes|techcrunch|yahoo|businesswire|globenewswire|press)/.test(referrerUrl)) {
    return { channel: "pr", subchannel: extractDomain(referrerUrl), rule: "pr_domain" };
  }
  if (/(reddit|discord|quora|slack|forum|community|group)/.test([utmSource, source, referrerUrl, landingPage].join(" "))) {
    return { channel: "community", subchannel: extractDomain(referrerUrl) || source || utmSource || "community", rule: "community_source" };
  }
  if (/(facebook|instagram|tiktok|x|twitter|youtube|pinterest|linkedin)/.test([utmSource, source, referrerUrl, sourceDescription].join(" "))) {
    return { channel: "sns", subchannel: source || utmSource || extractDomain(referrerUrl) || "social", rule: "social_source" };
  }
  if (/(google|bing|yahoo|duckduckgo|baidu)/.test([utmSource, source, referrerUrl, sourceDescription].join(" "))) {
    return { channel: "organic", subchannel: source || utmSource || extractDomain(referrerUrl) || "search", rule: "organic_search_source" };
  }
  if (
    source === "direct" ||
    source === "unknown" ||
    (!source && !utmSource && !utmMedium && !referrerUrl && !referralCode)
  ) {
    return { channel: "direct", subchannel: "direct", rule: "direct_or_empty" };
  }
  return { channel: "unknown", subchannel: source || extractDomain(referrerUrl) || "unknown", rule: "fallback_unknown" };
}

function extractDomain(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    return new URL(text).hostname.replace(/^www\./, "");
  } catch {
    return text
      .replace(/^https?:\/\//, "")
      .replace(/^android-app:\/\//, "")
      .split("/")[0]
      .replace(/^www\./, "");
  }
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
    payment_completion_rate: round(result.checkouts ? (result.purchases / result.checkouts) * 100 : 0),
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

function buildSyncSummary(rows, integrationRows = []) {
  const sorted = rows
    .filter((row) => row.last_synced_at)
    .sort((a, b) => String(b.last_synced_at).localeCompare(String(a.last_synced_at)));

  const integrationBySource = Object.fromEntries(
    integrationRows.map((row) => [row.source, row]),
  );

  return {
    last_synced_at: sorted[0]?.last_synced_at || null,
    status: sorted[0]?.status || "unknown",
    updated_at: sorted[0]?.updated_at || null,
    ga4: {
      status: integrationBySource.ga4?.status || "unknown",
      last_synced_at: integrationBySource.ga4?.last_synced_at || null,
      skipped_segments: Array.isArray(integrationBySource.ga4?.config?.skipped_segments)
        ? integrationBySource.ga4.config.skipped_segments
        : [],
    },
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

async function safeSupabaseFetch(path, fallback = [], options = {}) {
  try {
    return await supabaseFetch(path, options);
  } catch (error) {
    const details = error?.details;
    const message = JSON.stringify(details || {});
    if (error.statusCode === 404 || /user_behavior_events|behavior/i.test(message)) {
      return fallback;
    }
    throw error;
  }
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

function trimText(value) {
  const text = String(value || "").trim();
  return text || "";
}

function normalizeJsonObject(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function number(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
