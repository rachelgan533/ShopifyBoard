module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertEnv();

    const [
      summaryRows,
      dailyRows,
      productRows,
      countryRows,
      customerSegmentRows,
      couponUsageRows,
      channelRows,
      ga4FunnelRows,
      adPerformanceRows,
      syncRows,
    ] = await Promise.all([
      supabaseFetch("/rest/v1/dashboard_summary_30d?select=*&limit=1"),
      supabaseFetch("/rest/v1/dashboard_daily_sales?select=*&order=day.asc&limit=30"),
      supabaseFetch("/rest/v1/dashboard_top_products?select=*&order=revenue.desc&limit=10"),
      supabaseFetch("/rest/v1/dashboard_country_sales?select=*&order=revenue.desc&limit=10"),
      supabaseFetch("/rest/v1/dashboard_customer_segments?select=*&order=revenue.desc&limit=10"),
      supabaseFetch("/rest/v1/dashboard_coupon_usage?select=*&order=revenue.desc&limit=10"),
      supabaseFetch("/rest/v1/dashboard_channel_sales?select=*&order=revenue.desc&limit=10"),
      supabaseFetch("/rest/v1/dashboard_ga4_funnel_30d?select=*&limit=1"),
      supabaseFetch("/rest/v1/dashboard_ad_performance_30d?select=*&order=revenue.desc&limit=20"),
      supabaseFetch("/rest/v1/sync_state?source=eq.shopify&resource=eq.orders&select=last_synced_at,status,updated_at&limit=1"),
    ]);

    const summary = summaryRows[0] || {};
    const ga4 = ga4FunnelRows[0] || {};
    const sync = syncRows[0] || {};

    return res.status(200).json({
      ok: true,
      summary: {
        gmv: number(summary.gmv),
        net_sales: number(summary.net_sales),
        orders: number(summary.orders),
        customers: number(summary.customers),
        aov: number(summary.aov),
        refunds: number(summary.refunds),
        refund_rate: number(summary.refund_rate),
      },
      daily_sales: dailyRows.map((row) => ({
        day: row.day,
        gmv: number(row.gmv),
        orders: number(row.orders),
        customers: number(row.customers),
        aov: number(row.aov),
      })),
      top_products: productRows.map((row) => ({
        title: row.title || "Unknown product",
        sku: row.sku || "",
        units_sold: number(row.units_sold),
        revenue: number(row.revenue),
      })),
      country_sales: countryRows.map((row) => ({
        country: row.country || "Unknown",
        orders: number(row.orders),
        customers: number(row.customers),
        revenue: number(row.revenue),
        aov: number(row.aov),
        order_share: number(row.order_share),
      })),
      customer_segments: customerSegmentRows.map((row) => ({
        segment: row.segment || "Unknown",
        customers: number(row.customers),
        revenue: number(row.revenue),
        avg_customer_value: number(row.avg_customer_value),
      })),
      coupon_usage: couponUsageRows.map((row) => ({
        category: row.category || "Unknown",
        orders: number(row.orders),
        revenue: number(row.revenue),
        order_share: number(row.order_share),
      })),
      channel_sales: channelRows.map((row) => ({
        channel: row.channel || "unknown",
        orders: number(row.orders),
        customers: number(row.customers),
        revenue: number(row.revenue),
        aov: number(row.aov),
      })),
      ga4_funnel: {
        sessions: number(ga4.sessions),
        users: number(ga4.users),
        add_to_carts: number(ga4.add_to_carts),
        checkouts: number(ga4.checkouts),
        purchases: number(ga4.purchases),
        add_to_cart_rate: number(ga4.add_to_cart_rate),
        checkout_rate: number(ga4.checkout_rate),
        cvr: number(ga4.cvr),
      },
      ad_performance: adPerformanceRows.map((row) => ({
        source: row.source || "unknown",
        spend: number(row.spend),
        revenue: number(row.revenue),
        impressions: number(row.impressions),
        clicks: number(row.clicks),
        purchases: number(row.purchases),
        roas: number(row.roas),
        cpa: number(row.cpa),
        ctr: number(row.ctr),
        cpc: number(row.cpc),
      })),
      sync: {
        last_synced_at: sync.last_synced_at || null,
        status: sync.status || "unknown",
        updated_at: sync.updated_at || null,
      },
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

async function supabaseFetch(path) {
  const response = await fetch(`${trimSlash(process.env.SUPABASE_URL)}${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      "content-type": "application/json",
    },
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
