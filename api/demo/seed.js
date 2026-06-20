const crypto = require("crypto");

module.exports = async function handler(req, res) {
  try {
    assertEnv();
    assertAuthorized(req);

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = await readJson(req);
    const action = String(body.action || "seed").trim().toLowerCase();
    const demoShop = await ensureDemoShop(body.shop_domain, body.shop_name);

    if (action === "clear") {
      const cleared = await clearDemoData(demoShop.id);
      return res.status(200).json({
        ok: true,
        action: "clear",
        shop_id: demoShop.id,
        shop_domain: demoShop.shop_domain,
        cleared,
      });
    }

    const days = Math.max(7, Math.min(90, Number(body.days || 30) || 30));
    const payload = buildDemoPayload(demoShop, days);
    await upsertDemoData(demoShop, payload);

    return res.status(200).json({
      ok: true,
      action: "seed",
      shop_id: demoShop.id,
      shop_domain: demoShop.shop_domain,
      days,
      seeded: summarizePayload(payload),
      note: "演示数据已写入 Supabase。当前所有看板会把这批数据当成真实数据来展示。",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Demo seed failed",
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

function assertAuthorized(req) {
  if (!process.env.CRON_SECRET) return;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query?.secret;
  if (token !== process.env.CRON_SECRET) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
}

async function ensureDemoShop(inputDomain, inputName) {
  const domain = String(inputDomain || "demo-bohealthy.myshopify.com").trim() || "demo-bohealthy.myshopify.com";
  const name = String(inputName || "boHealthy Demo Store").trim() || "boHealthy Demo Store";

  await supabaseFetch("/rest/v1/shops?on_conflict=shop_domain", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        shop_domain: domain,
        shop_name: name,
        currency: "USD",
        timezone: "America/Los_Angeles",
      },
    ]),
  });

  const rows = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(domain)}&select=id,shop_domain,shop_name&limit=1`,
  );

  if (!rows[0]?.id) {
    const error = new Error("Failed to create demo shop");
    error.statusCode = 500;
    throw error;
  }

  return rows[0];
}

async function clearDemoData(shopId) {
  const tables = [
    "sync_state",
    "goals",
    "coupon_codes",
    "audience_segments",
    "traffic_attribution_daily",
    "ad_daily_metrics",
    "ga4_daily_metrics",
    "user_behavior_events",
    "refunds",
    "order_line_items",
    "orders",
    "products",
    "customers",
  ];

  for (const table of tables) {
    await supabaseFetch(`/rest/v1/${table}?shop_id=eq.${encodeURIComponent(shopId)}`, {
      method: "DELETE",
      headers: { prefer: "return=minimal" },
    });
  }

  return tables.length;
}

function buildDemoPayload(shop, days) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const locations = [
    { country: "United States", province: "California", city: "Los Angeles", weight: 26 },
    { country: "United States", province: "Texas", city: "Houston", weight: 15 },
    { country: "United States", province: "Florida", city: "Miami", weight: 13 },
    { country: "United Kingdom", province: "England", city: "London", weight: 9 },
    { country: "Canada", province: "Ontario", city: "Toronto", weight: 8 },
    { country: "Australia", province: "New South Wales", city: "Sydney", weight: 7 },
    { country: "Germany", province: "Berlin", city: "Berlin", weight: 6 },
    { country: "France", province: "Ile-de-France", city: "Paris", weight: 5 },
    { country: "India", province: "Maharashtra", city: "Mumbai", weight: 7 },
    { country: "Singapore", province: "Singapore", city: "Singapore", weight: 4 },
  ];

  const channels = [
    { name: "Paid Social", weight: 28 },
    { name: "Direct", weight: 22 },
    { name: "Organic Search", weight: 16 },
    { name: "Email", weight: 10 },
    { name: "Paid Search", weight: 14 },
    { name: "Referral", weight: 10 },
  ];

  const products = [
    { id: "demo_product_01", title: "C16 3-in-1 Multi-Function Juicer", sku: "C16-3IN1", price: 189, vendor: "boHealthy", product_type: "Juicer" },
    { id: "demo_product_02", title: "Cold Press Blender Pro", sku: "CPB-PRO", price: 159, vendor: "boHealthy", product_type: "Blender" },
    { id: "demo_product_03", title: "Portable Juice Cup", sku: "PORT-CUP", price: 69, vendor: "boHealthy", product_type: "Cup" },
    { id: "demo_product_04", title: "Glass Bottle Set", sku: "GLASS-SET", price: 39, vendor: "boHealthy", product_type: "Accessory" },
    { id: "demo_product_05", title: "Filter Replacement Kit", sku: "FILTER-KIT", price: 29, vendor: "boHealthy", product_type: "Accessory" },
    { id: "demo_product_06", title: "Smoothie Maker Mini", sku: "SMOOTH-MINI", price: 99, vendor: "boHealthy", product_type: "Blender" },
    { id: "demo_product_07", title: "Premium Fruit Prep Tool", sku: "PREP-TOOL", price: 24, vendor: "boHealthy", product_type: "Accessory" },
    { id: "demo_product_08", title: "Family Juicer Bundle", sku: "BUNDLE-FAM", price: 249, vendor: "boHealthy", product_type: "Bundle" },
  ];

  const coupons = [
    { code: "DEMO-NEW10", category: "新人券", owner: "新客激活", status: "启用" },
    { code: "DEMO-SUMMER15", category: "站内活动券", owner: "夏日活动", status: "启用" },
    { code: "DEMO-KOL-ANNA", category: "达人券", owner: "ANNA", status: "启用" },
    { code: "DEMO-KOL-JAY", category: "达人券", owner: "JAY", status: "启用" },
    { code: "DEMO-VIP20", category: "站内活动券", owner: "VIP Campaign", status: "启用" },
  ];

  const firstNames = ["Olivia", "Emma", "Liam", "Noah", "Ava", "Sophia", "Mason", "Lucas", "Mia", "Ethan", "Harper", "Amelia"];
  const lastNames = ["Johnson", "Brown", "Davis", "Garcia", "Smith", "Wilson", "Miller", "Lee", "Walker", "Taylor", "Moore", "Martin"];

  const customerCount = 160;
  const customers = [];
  const customersById = new Map();
  for (let i = 1; i <= customerCount; i += 1) {
    const location = pickWeighted(locations, i * 17);
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i * 3) % lastNames.length];
    const id = `demo_customer_${String(i).padStart(3, "0")}`;
    const customer = {
      id,
      shop_id: shop.id,
      email: `demo.customer${String(i).padStart(3, "0")}@example.com`,
      first_name: first,
      last_name: last,
      first_order_at: null,
      last_order_at: null,
      orders_count: 0,
      total_spent: 0,
      country: location.country,
      province: location.province,
      city: location.city,
      raw: { demo_seed: true },
    };
    customers.push(customer);
    customersById.set(id, customer);
  }

  const orders = [];
  const lineItems = [];
  const refunds = [];
  const ordersByCoupon = new Map(coupons.map((coupon) => [coupon.code, 0]));
  const revenueByCoupon = new Map(coupons.map((coupon) => [coupon.code, 0]));
  const productUnits = new Map(products.map((product) => [product.id, 0]));
  const dailyRevenue = [];
  const dailyOrderCount = [];
  const channelRevenue = new Map(channels.map((channel) => [channel.name, 0]));
  const channelOrders = new Map(channels.map((channel) => [channel.name, 0]));

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayDate = new Date(today);
    dayDate.setUTCDate(today.getUTCDate() - (days - 1 - dayIndex));
    const dateOnly = toDateOnly(dayDate);
    const baseOrders = 18 + Math.floor(pseudo(dayIndex + 1) * 12) + (dayIndex % 6 === 0 ? 10 : 0);
    let dayRevenue = 0;

    for (let orderIndex = 1; orderIndex <= baseOrders; orderIndex += 1) {
      const customer = customers[(dayIndex * 11 + orderIndex * 7) % customers.length];
      const channel = pickWeighted(channels, dayIndex * 100 + orderIndex * 13);
      const firstProduct = products[(dayIndex + orderIndex) % products.length];
      const secondProduct = products[(dayIndex * 2 + orderIndex * 5) % products.length];
      const orderId = `demo_order_${dateOnly.replace(/-/g, "")}_${String(orderIndex).padStart(2, "0")}`;
      const createdAt = `${dateOnly}T${String(8 + (orderIndex % 11)).padStart(2, "0")}:${String((orderIndex * 7) % 60).padStart(2, "0")}:00.000Z`;
      const lineCount = orderIndex % 4 === 0 ? 2 : 1;
      const coupon = selectCoupon(dayIndex, orderIndex, coupons, customer.orders_count);
      const items = [];
      const firstQty = 1 + ((dayIndex + orderIndex) % 2);
      items.push({ product: firstProduct, quantity: firstQty });
      if (lineCount > 1) {
        items.push({ product: secondProduct, quantity: 1 });
      }
      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const discountAmount = coupon ? round(subtotal * (coupon.category === "达人券" ? 0.12 : coupon.category === "新人券" ? 0.1 : 0.08)) : 0;
      const taxAmount = round((subtotal - discountAmount) * 0.07);
      const refunded = orderIndex % 23 === 0 ? round((subtotal - discountAmount) * 0.25) : 0;
      const total = round(subtotal - discountAmount + taxAmount);

      const order = {
        id: orderId,
        shop_id: shop.id,
        name: `#D${dateOnly.slice(5).replace("-", "")}${String(orderIndex).padStart(3, "0")}`,
        created_at: createdAt,
        updated_at: createdAt,
        processed_at: createdAt,
        currency: "USD",
        total_price: total,
        subtotal_price: subtotal,
        total_tax: taxAmount,
        total_discounts: discountAmount,
        total_refunded: refunded,
        financial_status: refunded > 0 ? "partially_refunded" : "paid",
        fulfillment_status: "fulfilled",
        customer_id: customer.id,
        customer_email: customer.email,
        customer_country: customer.country,
        customer_province: customer.province,
        customer_city: customer.city,
        source_name: channel.name,
        landing_site: `https://demo-bohealthy.myshopify.com/products/${slugify(firstProduct.title)}`,
        referring_site: channel.name === "Paid Social" ? "instagram.com" : channel.name === "Referral" ? "youtube.com" : "",
        discount_codes: coupon ? [coupon.code] : [],
        raw: { demo_seed: true, coupon_category: coupon?.category || null },
        synced_at: new Date().toISOString(),
      };
      orders.push(order);
      dayRevenue += total;
      channelRevenue.set(channel.name, round(channelRevenue.get(channel.name) + total));
      channelOrders.set(channel.name, channelOrders.get(channel.name) + 1);

      customer.orders_count += 1;
      customer.total_spent = round(customer.total_spent + total);
      customer.first_order_at = customer.first_order_at || createdAt;
      customer.last_order_at = createdAt;

      items.forEach((item, itemIndex) => {
        productUnits.set(item.product.id, productUnits.get(item.product.id) + item.quantity);
        lineItems.push({
          id: `demo_line_item_${dateOnly.replace(/-/g, "")}_${String(orderIndex).padStart(2, "0")}_${itemIndex + 1}`,
          shop_id: shop.id,
          order_id: orderId,
          product_id: item.product.id,
          variant_id: `${item.product.id}_v1`,
          sku: item.product.sku,
          title: item.product.title,
          variant_title: item.product.product_type,
          quantity: item.quantity,
          price: item.product.price,
          total_discount: lineCount > 1 ? round(discountAmount / lineCount) : discountAmount,
          raw: { demo_seed: true },
        });
      });

      if (coupon) {
        ordersByCoupon.set(coupon.code, ordersByCoupon.get(coupon.code) + 1);
        revenueByCoupon.set(coupon.code, round(revenueByCoupon.get(coupon.code) + total));
      }

      if (refunded > 0) {
        refunds.push({
          id: `demo_refund_${orderId}`,
          shop_id: shop.id,
          order_id: orderId,
          created_at: createdAt,
          amount: refunded,
          currency: "USD",
          raw: { demo_seed: true },
          synced_at: new Date().toISOString(),
        });
      }
    }

    dailyRevenue.push(round(dayRevenue));
    dailyOrderCount.push(baseOrders);
  }

  const goalStart = new Date(today);
  goalStart.setUTCDate(1);
  const goalEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const monthRevenue = dailyRevenue.reduce((sum, value) => sum + value, 0);

  const ga4Daily = dailyRevenue.map((revenue, index) => {
    const ordersCount = dailyOrderCount[index];
    const sessions = Math.round(ordersCount / (0.017 + pseudo(index + 14) * 0.006));
    const users = Math.round(sessions * 0.74);
    const addToCarts = Math.round(sessions * (0.095 + pseudo(index + 30) * 0.018));
    const checkouts = Math.round(addToCarts * (0.46 + pseudo(index + 51) * 0.08));
    const purchases = ordersCount;
    const dayDate = new Date(today);
    dayDate.setUTCDate(today.getUTCDate() - (days - 1 - index));
    const day = toDateOnly(dayDate);
    return {
      shop_id: shop.id,
      day,
      sessions,
      users,
      add_to_carts: addToCarts,
      checkouts: checkouts,
      purchases,
      device: "all",
      country: "all",
      city: "all",
      raw: { demo_seed: true },
    };
  });

  const trafficChannelTemplate = [
    { primary: "ads", secondary: "Paid Social", share: 0.31, purchase_share: 0.24 },
    { primary: "ads", secondary: "Paid Search", share: 0.18, purchase_share: 0.17 },
    { primary: "direct", secondary: "Direct", share: 0.2, purchase_share: 0.22 },
    { primary: "organic", secondary: "Organic Search", share: 0.12, purchase_share: 0.14 },
    { primary: "edm", secondary: "Email", share: 0.08, purchase_share: 0.1 },
    { primary: "affiliate", secondary: "Referral", share: 0.06, purchase_share: 0.07 },
    { primary: "sns", secondary: "Organic Social", share: 0.05, purchase_share: 0.03 },
  ];

  const trafficDaily = ga4Daily.flatMap((row, index) => {
    let remainingSessions = row.sessions;
    let remainingUsers = row.users;
    let remainingNewUsers = Math.round(row.users * 0.42);
    let remainingEngaged = Math.round(row.sessions * 0.64);
    let remainingAddToCarts = row.add_to_carts;
    let remainingCheckouts = row.checkouts;
    let remainingPurchases = row.purchases;

    return trafficChannelTemplate.map((channel, channelIndex) => {
      const isLast = channelIndex === trafficChannelTemplate.length - 1;
      const sessions = isLast ? remainingSessions : Math.max(0, Math.round(row.sessions * channel.share));
      const users = isLast ? remainingUsers : Math.max(0, Math.round(row.users * channel.share));
      const newUsers = isLast ? remainingNewUsers : Math.max(0, Math.round(Math.round(row.users * 0.42) * channel.share));
      const engaged = isLast ? remainingEngaged : Math.max(0, Math.round(Math.round(row.sessions * 0.64) * channel.share));
      const addToCarts = isLast ? remainingAddToCarts : Math.max(0, Math.round(row.add_to_carts * channel.share));
      const checkouts = isLast ? remainingCheckouts : Math.max(0, Math.round(row.checkouts * channel.share));
      const purchases = isLast ? remainingPurchases : Math.max(0, Math.round(row.purchases * channel.purchase_share));

      remainingSessions -= sessions;
      remainingUsers -= users;
      remainingNewUsers -= newUsers;
      remainingEngaged -= engaged;
      remainingAddToCarts -= addToCarts;
      remainingCheckouts -= checkouts;
      remainingPurchases -= purchases;

      return {
        shop_id: shop.id,
        day: row.day,
        source_system: "ga4",
        channel_primary: channel.primary,
        channel_secondary: channel.secondary,
        sessions,
        users,
        new_users: newUsers,
        engaged_sessions: engaged,
        add_to_carts: addToCarts,
        checkouts,
        purchases,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        spend: 0,
        raw: { demo_seed: true, source: "ga4_channel_report", index },
      };
    });
  });

  const adCampaigns = [
    { source: "google_ads", id: "demo_google_brand", name: "Google Brand Search", share: 0.38 },
    { source: "google_ads", id: "demo_google_nonbrand", name: "Google Non-brand Search", share: 0.22 },
    { source: "meta_ads", id: "demo_meta_prospecting", name: "Meta Prospecting", share: 0.26 },
    { source: "meta_ads", id: "demo_meta_retargeting", name: "Meta Retargeting", share: 0.14 },
  ];

  const adDaily = [];
  dailyRevenue.forEach((revenue, index) => {
    const dayDate = new Date(today);
    dayDate.setUTCDate(today.getUTCDate() - (days - 1 - index));
    const day = toDateOnly(dayDate);
    adCampaigns.forEach((campaign, campaignIndex) => {
      const campaignRevenue = round(revenue * campaign.share * (0.55 + pseudo(index + campaignIndex * 9) * 0.2));
      const spend = round(campaignRevenue / (campaign.source === "google_ads" ? 3.8 : 2.7));
      const clicks = Math.max(20, Math.round(spend / (campaign.source === "google_ads" ? 1.9 : 1.35)));
      const impressions = clicks * Math.round(campaign.source === "google_ads" ? 28 + pseudo(index + 91) * 9 : 22 + pseudo(index + 105) * 8);
      const purchases = Math.max(3, Math.round(campaignRevenue / 165));
      adDaily.push({
        shop_id: shop.id,
        source: campaign.source,
        day,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        spend,
        impressions,
        clicks,
        purchases,
        revenue: campaignRevenue,
        raw: { demo_seed: true },
      });
    });
  });

  const audienceDate = toDateOnly(today);
  const audience = [
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "gender", [
      ["Female", 4200],
      ["Male", 3050],
      ["Unknown", 210],
    ]),
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "age", [
      ["25-34", 2600],
      ["35-44", 2150],
      ["18-24", 980],
      ["45-54", 1240],
      ["55-64", 390],
      ["65+", 100],
    ]),
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "device", [
      ["mobile", 4680],
      ["desktop", 2480],
      ["tablet", 300],
    ]),
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "country", [
      ["United States", 3150],
      ["United Kingdom", 880],
      ["Canada", 720],
      ["Australia", 510],
      ["Germany", 430],
      ["France", 310],
    ]),
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "city", [
      ["Los Angeles", 460],
      ["Houston", 320],
      ["Miami", 300],
      ["London", 260],
      ["Toronto", 240],
      ["Sydney", 180],
    ]),
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "language", [
      ["en-us", 4200],
      ["en-gb", 1200],
      ["fr-fr", 340],
      ["de-de", 280],
      ["es-es", 260],
    ]),
    ...buildAudienceSet(shop.id, "ga4", audienceDate, "interest", [
      ["Juicing & Healthy Living", 1200, 97],
      ["Kitchen Gadgets", 980, 92],
      ["Home Fitness", 760, 84],
      ["Organic Food", 680, 78],
      ["Meal Prep", 540, 72],
    ], true),
    ...buildAudienceSet(shop.id, "google_ads", audienceDate, "channel", [
      ["Paid Search", 2600],
      ["Brand Search", 940],
      ["Shopping", 830],
    ]),
    ...buildAudienceSet(shop.id, "meta_ads", audienceDate, "channel", [
      ["Prospecting", 1900],
      ["Retargeting", 740],
      ["Video Viewers", 620],
    ]),
  ];

  const searchConsole = buildSearchConsoleDemo(shop.id, today, days);

  const couponRows = coupons.map((coupon) => ({
    shop_id: shop.id,
    code: coupon.code,
    category: coupon.category,
    owner: coupon.owner,
    usage_count: ordersByCoupon.get(coupon.code) || 0,
    status: coupon.status,
    raw: {
      demo_seed: true,
      revenue: revenueByCoupon.get(coupon.code) || 0,
    },
  }));

  const productsRows = products.map((product) => ({
    id: product.id,
    shop_id: shop.id,
    title: product.title,
    handle: slugify(product.title),
    vendor: product.vendor,
    product_type: product.product_type,
    status: "active",
    raw: {
      demo_seed: true,
      units_sold: productUnits.get(product.id),
    },
  }));

  const goals = [
    {
      id: "00000000-0000-0000-0000-000000000301",
      shop_id: shop.id,
      name: "[DEMO] 本月 GMV 增长目标",
      description: "用于演示北极星看板与增长模拟器的目标设定",
      start_date: toDateOnly(goalStart),
      end_date: toDateOnly(goalEnd),
      target_gmv: round(monthRevenue * 1.18),
      status: "active",
      is_active: true,
    },
  ];

  const behaviorEvents = buildBehaviorEvents(shop, {
    days,
    today,
    ga4Daily,
    trafficDaily,
    orders,
    products,
    channels,
  });

  return {
    customers,
    products: productsRows,
    orders,
    lineItems,
    refunds,
    coupons: couponRows,
    goals,
    ga4Daily,
    trafficDaily,
    adDaily,
    searchConsole,
    audience,
    behaviorEvents,
  };
}

function buildSearchConsoleDemo(shopId, today, days) {
  const queries = [
    "cold press juicer",
    "best juicer for celery",
    "portable juice cup",
    "juicer bundle",
    "smoothie maker mini",
    "slow juicer vs blender",
  ];
  const pages = [
    "/products/c16-3-in-1-multi-function-juicer",
    "/products/cold-press-blender-pro",
    "/products/portable-juice-cup",
    "/collections/juicers",
    "/blogs/news/how-to-choose-a-juicer",
  ];
  const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany"];
  const devices = ["mobile", "desktop", "tablet"];
  const rows = [];

  for (let index = 0; index < days; index += 1) {
    const dayDate = new Date(today);
    dayDate.setUTCDate(today.getUTCDate() - (days - 1 - index));
    const day = toDateOnly(dayDate);
    const clicks = 140 + Math.round(pseudo(index + 301) * 90);
    const impressions = clicks * (10 + Math.round(pseudo(index + 317) * 8));
    const ctr = round((clicks / Math.max(impressions, 1)) * 100);
    const position = round(4.2 + pseudo(index + 329) * 6.8);

    rows.push({
      shop_id: shopId,
      site_url: "sc-domain:demo-bohealthy.com",
      day,
      dimension_type: "summary",
      dimension_value: "all",
      clicks,
      impressions,
      ctr,
      position,
      raw: { demo_seed: true },
    });

    queries.forEach((query, queryIndex) => {
      const queryClicks = Math.max(8, Math.round(clicks * (0.24 - queryIndex * 0.025 + pseudo(index + queryIndex + 341) * 0.015)));
      const queryImpressions = Math.max(queryClicks * 6, Math.round(impressions * (0.2 - queryIndex * 0.02 + pseudo(index + queryIndex + 353) * 0.02)));
      rows.push({
        shop_id: shopId,
        site_url: "sc-domain:demo-bohealthy.com",
        day,
        dimension_type: "query",
        dimension_value: query,
        clicks: queryClicks,
        impressions: queryImpressions,
        ctr: round((queryClicks / Math.max(queryImpressions, 1)) * 100),
        position: round(position + queryIndex * 0.7),
        raw: { demo_seed: true },
      });
    });

    pages.forEach((page, pageIndex) => {
      const pageClicks = Math.max(10, Math.round(clicks * (0.28 - pageIndex * 0.035 + pseudo(index + pageIndex + 367) * 0.02)));
      const pageImpressions = Math.max(pageClicks * 7, Math.round(impressions * (0.25 - pageIndex * 0.03 + pseudo(index + pageIndex + 379) * 0.02)));
      rows.push({
        shop_id: shopId,
        site_url: "sc-domain:demo-bohealthy.com",
        day,
        dimension_type: "page",
        dimension_value: page,
        clicks: pageClicks,
        impressions: pageImpressions,
        ctr: round((pageClicks / Math.max(pageImpressions, 1)) * 100),
        position: round(position + pageIndex * 0.5),
        raw: { demo_seed: true },
      });
    });

    countries.forEach((country, countryIndex) => {
      const countryClicks = Math.max(6, Math.round(clicks * (0.35 - countryIndex * 0.05 + pseudo(index + countryIndex + 391) * 0.02)));
      const countryImpressions = Math.max(countryClicks * 8, Math.round(impressions * (0.33 - countryIndex * 0.045 + pseudo(index + countryIndex + 401) * 0.02)));
      rows.push({
        shop_id: shopId,
        site_url: "sc-domain:demo-bohealthy.com",
        day,
        dimension_type: "country",
        dimension_value: country,
        clicks: countryClicks,
        impressions: countryImpressions,
        ctr: round((countryClicks / Math.max(countryImpressions, 1)) * 100),
        position: round(position + countryIndex * 0.35),
        raw: { demo_seed: true },
      });
    });

    devices.forEach((device, deviceIndex) => {
      const deviceClicks = Math.max(4, Math.round(clicks * (device === "mobile" ? 0.58 : device === "desktop" ? 0.34 : 0.08)));
      const deviceImpressions = Math.max(deviceClicks * 9, Math.round(impressions * (device === "mobile" ? 0.56 : device === "desktop" ? 0.35 : 0.09)));
      rows.push({
        shop_id: shopId,
        site_url: "sc-domain:demo-bohealthy.com",
        day,
        dimension_type: "device",
        dimension_value: device,
        clicks: deviceClicks,
        impressions: deviceImpressions,
        ctr: round((deviceClicks / Math.max(deviceImpressions, 1)) * 100),
        position: round(position + deviceIndex * 0.2),
        raw: { demo_seed: true },
      });
    });
  }

  return rows;
}

function buildBehaviorEvents(shop, context) {
  const { today, ga4Daily, trafficDaily, orders, products } = context;
  const events = [];
  const trafficByDay = trafficDaily.reduce((acc, row) => {
    if (!acc[row.day]) acc[row.day] = [];
    acc[row.day].push(row);
    return acc;
  }, {});
  const ordersByDay = orders.reduce((acc, row) => {
    const day = toDateOnly(row.created_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(row);
    return acc;
  }, {});

  ga4Daily.forEach((dayRow, dayIndex) => {
    const day = dayRow.day;
    const channelRows = (trafficByDay[day] || []).filter((row) => Number(row.sessions || 0) > 0);
    const dayOrders = ordersByDay[day] || [];
    const sessionCount = Math.max(Math.min(Math.round(Number(dayRow.sessions || 0) * 0.22), 360), 96);
    const targetAddToCarts = Math.max(Number(dayRow.add_to_carts || 0), Math.round(sessionCount * 0.12));
    const targetCheckouts = Math.max(Number(dayRow.checkouts || 0), Math.round(targetAddToCarts * 0.55));
    const targetPurchases = Math.min(dayOrders.length, targetCheckouts);
    const targetSearches = Math.max(Math.round(sessionCount * 0.11), 6);
    const targetReviews = Math.max(Math.round(sessionCount * 0.13), 8);
    const targetFaqs = Math.max(Math.round(sessionCount * 0.1), 6);
    const targetShipping = Math.max(Math.round(sessionCount * 0.08), 5);

    const purchaseSessions = targetPurchases;
    const checkoutAbandonSessions = Math.max(targetCheckouts - targetPurchases, Math.round(sessionCount * 0.09));
    const cartAbandonSessions = Math.max(targetAddToCarts - targetCheckouts, Math.round(sessionCount * 0.12));
    const deepBrowseSessions = Math.max(Math.round(sessionCount * 0.18), 14);
    const searchIntentSessions = Math.max(targetSearches, Math.round(sessionCount * 0.1));
    const listBrowseSessions = Math.max(Math.round(sessionCount * 0.16), 12);
    let bounceSessions =
      sessionCount -
      purchaseSessions -
      checkoutAbandonSessions -
      cartAbandonSessions -
      deepBrowseSessions -
      searchIntentSessions -
      listBrowseSessions;
    if (bounceSessions < Math.round(sessionCount * 0.12)) {
      bounceSessions = Math.round(sessionCount * 0.12);
    }

    const sessionTypes = [
      ...Array(bounceSessions).fill("bounce"),
      ...Array(listBrowseSessions).fill("list_browse"),
      ...Array(deepBrowseSessions).fill("deep_browse"),
      ...Array(searchIntentSessions).fill("search_intent"),
      ...Array(cartAbandonSessions).fill("cart_abandon"),
      ...Array(checkoutAbandonSessions).fill("checkout_abandon"),
      ...Array(purchaseSessions).fill("purchase"),
    ].slice(0, sessionCount);

    while (sessionTypes.length < sessionCount) sessionTypes.push("list_browse");

    const searchTerms = [
      "cold press juicer",
      "portable juicer",
      "juicer bundle",
      "replacement filter",
      "smoothie maker",
      "best juicer for celery",
    ];

    let reviewBudget = targetReviews;
    let faqBudget = targetFaqs;
    let shippingBudget = targetShipping;
    let searchBudget = targetSearches;
    let eventSequence = 0;

    sessionTypes.forEach((type, sessionIndex) => {
      const channelRow = pickWeightedChannel(channelRows, dayIndex * 1000 + sessionIndex) || pickChannel(channelRows, sessionIndex);
      const channel = channelRow?.channel_primary || "direct";
      const sessionId = `demo_behavior_${day.replace(/-/g, "")}_${String(sessionIndex + 1).padStart(4, "0")}`;
      const pseudoId = `demo_user_${((dayIndex * 193 + sessionIndex) % 4200) + 1}`;
      const product = products[(dayIndex * 7 + sessionIndex * 3) % products.length];
      const productUrl = `/products/${slugify(product.title)}`;
      const collectionUrl = "/collections/juicers";
      const homeUrl = sessionIndex % 4 === 0 ? "/collections/bestsellers" : "/";
      const order = type === "purchase" ? dayOrders[sessionIndex % Math.max(dayOrders.length, 1)] : null;

      const sessionEvents = [
        { event_name: "page_view", page_url: homeUrl, page_type: homeUrl === "/" ? "home" : "collection" },
        {
          event_name: "module_view",
          page_url: homeUrl,
          page_type: homeUrl === "/" ? "home" : "collection",
          properties: {
            module_id: "home_hero_primary",
            module_type: "hero",
            module_name: "首页首屏主推",
            module_position: "home_hero_1",
          },
        },
      ];

      if (type !== "bounce") {
        sessionEvents.push({
          event_name: "view_item_list",
          page_url: collectionUrl,
          page_type: "collection",
          collection_id: "juicers",
        });
        sessionEvents.push({
          event_name: "module_view",
          page_url: collectionUrl,
          page_type: "collection",
          properties: {
            module_id: "collection_recommendation_grid",
            module_type: "recommendation",
            module_name: "集合页商品推荐",
            module_position: "collection_grid",
          },
        });
      }

      if (["deep_browse", "search_intent", "cart_abandon", "checkout_abandon", "purchase"].includes(type)) {
        sessionEvents.push({
          event_name: "view_item",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          variant_id: `${product.id}_v1`,
        });
        sessionEvents.push({
          event_name: "module_view",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          properties: {
            module_id: "pdp_sticky_atc",
            module_type: "add_to_cart",
            module_name: "商品页悬浮加购",
            module_position: "pdp_sticky_bottom",
          },
        });
      }

      if ((type === "search_intent" || (type === "deep_browse" && searchBudget > 0)) && searchBudget > 0) {
        sessionEvents.splice(1, 0, {
          event_name: "site_search",
          page_url: "/search",
          page_type: "search",
          search_term: searchTerms[(dayIndex + sessionIndex) % searchTerms.length],
        });
        sessionEvents.splice(2, 0, {
          event_name: "module_submit",
          page_url: "/search",
          page_type: "search",
          search_term: searchTerms[(dayIndex + sessionIndex) % searchTerms.length],
          properties: {
            module_id: "header_search",
            module_type: "search",
            module_name: "顶部搜索框",
            module_position: "header",
          },
        });
        searchBudget -= 1;
      }

      if (["deep_browse", "cart_abandon", "checkout_abandon", "purchase"].includes(type) && reviewBudget > 0) {
        sessionEvents.push({
          event_name: "module_view",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          properties: {
            module_id: "pdp_reviews",
            module_type: "review",
            module_name: "商品评价模块",
            module_position: "pdp_below_gallery",
          },
        });
        sessionEvents.push({
          event_name: "module_expand",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          properties: {
            module_id: "pdp_reviews",
            module_type: "review",
            module_name: "商品评价模块",
            module_position: "pdp_below_gallery",
          },
        });
        sessionEvents.push({
          event_name: "review_opened",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
        });
        reviewBudget -= 1;
      }

      if (["deep_browse", "checkout_abandon", "purchase"].includes(type) && faqBudget > 0) {
        sessionEvents.push({
          event_name: "module_expand",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          properties: {
            module_id: "pdp_faq",
            module_type: "faq",
            module_name: "商品 FAQ",
            module_position: "pdp_detail_tabs",
          },
        });
        sessionEvents.push({
          event_name: "faq_opened",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
        });
        faqBudget -= 1;
      }

      if (["checkout_abandon", "purchase"].includes(type) && shippingBudget > 0) {
        sessionEvents.push({
          event_name: "module_expand",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          properties: {
            module_id: "pdp_shipping_info",
            module_type: "shipping",
            module_name: "配送与退换说明",
            module_position: "pdp_detail_tabs",
          },
        });
        sessionEvents.push({
          event_name: "shipping_info_opened",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
        });
        shippingBudget -= 1;
      }

      if (["cart_abandon", "checkout_abandon", "purchase"].includes(type)) {
        sessionEvents.push({
          event_name: "module_click",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          properties: {
            module_id: "pdp_sticky_atc",
            module_type: "add_to_cart",
            module_name: "商品页悬浮加购",
            module_position: "pdp_sticky_bottom",
          },
        });
        sessionEvents.push({
          event_name: "add_to_cart",
          page_url: productUrl,
          page_type: "product",
          product_id: product.id,
          variant_id: `${product.id}_v1`,
          value: product.price,
        });
        sessionEvents.push({
          event_name: "view_cart",
          page_url: "/cart",
          page_type: "cart",
        });
        sessionEvents.push({
          event_name: "module_view",
          page_url: "/cart",
          page_type: "cart",
          properties: {
            module_id: "cart_bundle_upsell",
            module_type: "upsell",
            module_name: "购物车 Bundle 推荐",
            module_position: "cart_drawer_bottom",
          },
        });
      }

      if (["checkout_abandon", "purchase"].includes(type)) {
        sessionEvents.push({
          event_name: "begin_checkout",
          page_url: "/checkout",
          page_type: "checkout",
          value: round(89 + pseudo(dayIndex * 37 + sessionIndex) * 180),
        });
      }

      if (type === "purchase" && order) {
        sessionEvents.push({
          event_name: "purchase",
          event_time: order.created_at,
          page_url: "/checkout/thank-you",
          page_type: "checkout",
          customer_id: order.customer_id,
          value: order.total_price,
          properties: {
            order_id: order.id,
            order_name: order.name,
            discount_codes: order.discount_codes || [],
          },
        });
      }

      sessionEvents.forEach((event, eventIndex) => {
        events.push(
          buildBehaviorEvent(shop.id, day, dayIndex, eventSequence, event.event_name, {
            session_id: sessionId,
            user_pseudo_id: order?.customer_id ? `demo_customer_user_${order.customer_id}` : pseudoId,
            customer_id: event.customer_id || order?.customer_id || null,
            page_url: event.page_url,
            page_type: event.page_type,
            channel_primary: event.event_name === "purchase" && order ? normalizeBehaviorChannel(order.source_name) : channel,
            product_id: event.product_id || null,
            variant_id: event.variant_id || null,
            collection_id: event.collection_id || null,
            search_term: event.search_term || null,
            value: Number(event.value || 0),
            event_time: event.event_time,
            properties: {
              session_type: type,
              demo_path: sessionEvents.map((item) => item.event_name),
              ...(event.properties || {}),
            },
          }),
        );
        eventSequence += 1;
      });
    });
  });

  return events;
}

function pickWeightedChannel(rows, seed) {
  if (!rows?.length) return null;
  const total = rows.reduce((sum, row) => sum + Math.max(Number(row.sessions || 0), 0), 0);
  if (!total) return rows[seed % rows.length];
  let cursor = pseudo(seed) * total;
  for (const row of rows) {
    cursor -= Math.max(Number(row.sessions || 0), 0);
    if (cursor <= 0) return row;
  }
  return rows[rows.length - 1];
}

function buildBehaviorEvent(shopId, day, dayIndex, sequence, eventName, extras = {}) {
  const hour = 8 + (sequence % 12);
  const minute = (sequence * 7) % 60;
  const second = (sequence * 13) % 60;
  const eventTime =
    extras.event_time ||
    `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000Z`;
  const sessionNumber = Math.max(1, Math.floor(sequence / 3) + 1);
  const pseudoId = `demo_user_${((dayIndex * 91 + sequence) % 2200) + 1}`;
  return {
    id: demoUuid(`behavior-${day}-${eventName}-${sequence}`),
    shop_id: shopId,
    event_time: eventTime,
    event_name: eventName,
    session_id: extras.session_id || `demo_session_${day.replace(/-/g, "")}_${sessionNumber}`,
    user_pseudo_id: extras.user_pseudo_id || pseudoId,
    customer_id: extras.customer_id || null,
    page_url: extras.page_url || "/",
    page_type: extras.page_type || "other",
    referrer: extras.referrer || "",
    channel_primary: extras.channel_primary || "direct",
    device_category: extras.device_category || pickDevice(sequence),
    country: extras.country || "",
    city: extras.city || "",
    product_id: extras.product_id || null,
    variant_id: extras.variant_id || null,
    collection_id: extras.collection_id || null,
    search_term: extras.search_term || null,
    value: Number(extras.value || 0),
    currency: "USD",
    properties: {
      demo_seed: true,
      ...(extras.properties || {}),
    },
  };
}

function pickChannel(rows, seed) {
  if (!rows.length) return null;
  return rows[seed % rows.length];
}

function pickDevice(seed) {
  const devices = ["mobile", "desktop", "tablet"];
  if (seed % 12 === 0) return "tablet";
  if (seed % 4 === 0) return "desktop";
  return devices[0];
}

function normalizeBehaviorChannel(sourceName) {
  const source = String(sourceName || "").toLowerCase();
  if (source.includes("social")) return "ads";
  if (source.includes("search")) return "ads";
  if (source.includes("email")) return "edm";
  if (source.includes("referral")) return "affiliate";
  if (source.includes("organic")) return "organic";
  return "direct";
}

function demoUuid(seed) {
  const hex = crypto.createHash("sha256").update(String(seed)).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function buildAudienceSet(shopId, source, day, segmentType, rows, withAffinity = false) {
  const total = rows.reduce((sum, row) => sum + Number(row[1] || 0), 0) || 1;
  return rows.map(([segmentName, users, affinity]) => ({
    shop_id: shopId,
    source,
    segment_type: segmentType,
    segment_name: segmentName,
    users,
    percentage: round((users / total) * 100),
    affinity: withAffinity ? affinity || null : null,
    day,
    raw: { demo_seed: true },
  }));
}

async function upsertDemoData(shop, payload) {
  await clearDemoData(shop.id);

  await upsertBatch("products", payload.products, "id");
  await upsertBatch("customers", payload.customers, "id");
  await upsertBatch("orders", payload.orders, "id");
  await upsertBatch("order_line_items", payload.lineItems, "id");
  await upsertBatch("refunds", payload.refunds, "id");
  await upsertBatch("coupon_codes", payload.coupons, "shop_id,code");
  await upsertBatch("goals", payload.goals, "id");
  await upsertBatch("ga4_daily_metrics", payload.ga4Daily, "shop_id,day,device,country,city");
  await upsertBatch("traffic_attribution_daily", payload.trafficDaily, "shop_id,day,source_system,channel_primary,channel_secondary");
  await upsertBatch("ad_daily_metrics", payload.adDaily, "shop_id,source,day,campaign_id");
  await upsertBatch("search_console_metrics", payload.searchConsole, "shop_id,site_url,day,dimension_type,dimension_value");
  await upsertBatch("audience_segments", payload.audience, "shop_id,source,segment_type,segment_name,day");
  await upsertBatch("user_behavior_events", payload.behaviorEvents, "id");

  await touchIntegration(shop.id, "shopify", "connected", {
    shop_domain: shop.shop_domain,
    shop_name: shop.shop_name,
    auth_mode: "demo",
  });
  await touchIntegration(shop.id, "ga4", "connected", {
    property_id: "demo-property",
    google_auth_mode: "Demo Data",
  });
  await touchIntegration(shop.id, "google_ads", "connected", {
    customer_id: "1234567890",
    customer_name: "Demo Google Ads Account",
    google_auth_mode: "Demo Data",
  });
  await touchIntegration(shop.id, "meta_ads", "connected", {
    ad_account_id: "act_demo",
    google_auth_mode: "Demo Data",
  });
  await touchIntegration(shop.id, "search_console", "connected", {
    site_url: "sc-domain:demo-bohealthy.com",
    google_auth_mode: "Demo Data",
  });

  await upsertSyncState(shop.id, "shopify", "orders");
  await upsertSyncState(shop.id, "ga4", "daily_metrics");
  await upsertSyncState(shop.id, "google_ads", "daily_metrics");
  await upsertSyncState(shop.id, "meta_ads", "daily_metrics");
  await upsertSyncState(shop.id, "search_console", "daily_metrics");
}

function summarizePayload(payload) {
  return {
    customers: payload.customers.length,
    products: payload.products.length,
    orders: payload.orders.length,
    line_items: payload.lineItems.length,
    refunds: payload.refunds.length,
    coupons: payload.coupons.length,
    ga4_daily_rows: payload.ga4Daily.length,
    traffic_daily_rows: payload.trafficDaily.length,
    ad_daily_rows: payload.adDaily.length,
    search_console_rows: payload.searchConsole.length,
    audience_rows: payload.audience.length,
    behavior_event_rows: payload.behaviorEvents.length,
    goals: payload.goals.length,
  };
}

async function touchIntegration(shopId, source, status, config = {}) {
  const existing = await supabaseFetch(
    `/rest/v1/data_integrations?shop_id=eq.${encodeURIComponent(shopId)}&source=eq.${encodeURIComponent(source)}&select=id,config&limit=1`,
  );

  const patch = {
    shop_id: shopId,
    source,
    status,
    config,
    last_connected_at: new Date().toISOString(),
    last_tested_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };

  if (existing[0]?.id) {
    await supabaseFetch(`/rest/v1/data_integrations?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        ...patch,
        config: {
          ...(existing[0].config || {}),
          ...config,
        },
      }),
    });
    return;
  }

  await supabaseFetch("/rest/v1/data_integrations", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}

async function upsertSyncState(shopId, source, resource) {
  const existing = await supabaseFetch(
    `/rest/v1/sync_state?shop_id=eq.${encodeURIComponent(shopId)}&source=eq.${encodeURIComponent(source)}&resource=eq.${encodeURIComponent(resource)}&select=id&limit=1`,
  );

  const patch = {
    shop_id: shopId,
    source,
    resource,
    last_synced_at: new Date().toISOString(),
    status: "success",
    error_message: null,
    cursor: null,
  };

  if (existing[0]?.id) {
    await supabaseFetch(`/rest/v1/sync_state?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return;
  }

  await supabaseFetch("/rest/v1/sync_state", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}

async function upsertBatch(table, rows, conflictColumns) {
  if (!rows.length) return;
  const chunkSize = 500;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    try {
      await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumns)}`, {
        method: "POST",
        headers: {
          prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
    } catch (error) {
      error.message = `Failed while writing ${table}`;
      error.details = {
        ...(error.details || {}),
        table,
        chunk_start: start,
        chunk_size: chunk.length,
        sample_row: chunk[0] || null,
      };
      throw error;
    }
  }
}

function selectCoupon(dayIndex, orderIndex, coupons, customerOrdersCount) {
  if (customerOrdersCount === 0 && orderIndex % 5 === 0) {
    return coupons[0];
  }
  if (orderIndex % 7 === 0) {
    return coupons[1];
  }
  if (orderIndex % 9 === 0) {
    return coupons[2 + (dayIndex % 2)];
  }
  if (orderIndex % 13 === 0) {
    return coupons[4];
  }
  return null;
}

function pickWeighted(items, seed) {
  const total = items.reduce((sum, item) => sum + Number(item.weight || 0), 0) || 1;
  let cursor = pseudo(seed) * total;
  for (const item of items) {
    cursor -= Number(item.weight || 0);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function pseudo(input) {
  const x = Math.sin(input * 999 + 17) * 10000;
  return x - Math.floor(x);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function toDateOnly(value) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
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
