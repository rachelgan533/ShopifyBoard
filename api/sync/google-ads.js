const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ADS_API_BASE = "https://googleads.googleapis.com/v19";
const DEFAULT_LOOKBACK_DAYS = 30;

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();

    const mode = req.query?.mode === "test" ? "test" : "sync";
    const result = mode === "test" ? await testGoogleAdsConnection() : await syncGoogleAds();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Google Ads sync failed",
      details: error.details,
    });
  }
};

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

function assertEnv() {
  const missing = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"].filter(
    (key) => !process.env[key],
  );
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

async function testGoogleAdsConnection() {
  const config = await getIntegrationConfig("google_ads");
  const context = buildGoogleAdsContext(config);
  const accessToken = await getGoogleAccessTokenFromRefreshToken(context.refreshToken);
  const customer = await fetchGoogleAdsCustomer(accessToken, context, true);
  const testedAt = new Date().toISOString();

  await touchIntegration("google_ads", {
    status: "connected",
    last_connected_at: testedAt,
    last_tested_at: testedAt,
    config: {
      customer_id: context.customerId,
      login_customer_id: context.loginCustomerId || "",
      developer_token: context.developerToken,
      lookback_days: String(context.lookbackDays),
      google_account_email: config.google_account_email || "",
      google_auth_mode: "Google OAuth",
      customer_name: customer.customer?.descriptiveName || config.customer_name || "",
    },
  });

  return {
    ok: true,
    customer_id: context.customerId,
    customer_name: customer.customer?.descriptiveName || "",
  };
}

async function syncGoogleAds() {
  const config = await getIntegrationConfig("google_ads");
  const context = buildGoogleAdsContext(config);
  const accessToken = await getGoogleAccessTokenFromRefreshToken(context.refreshToken);
  const shopId = await resolveShopId(config);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (context.lookbackDays - 1));
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const syncedAt = new Date().toISOString();

  const rows = await runGoogleAdsQuery(
    accessToken,
    context,
    `
      SELECT
        segments.date,
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != 'REMOVED'
    `,
  );

  const dailyRows = mapGoogleAdsDailyRows(shopId, rows);
  await upsertBatch("ad_daily_metrics", dailyRows, "shop_id,source,day,campaign_id");

  await touchIntegration("google_ads", {
    status: "connected",
    last_connected_at: syncedAt,
    last_tested_at: syncedAt,
    last_synced_at: syncedAt,
    config: {
      customer_id: context.customerId,
      login_customer_id: context.loginCustomerId || "",
      developer_token: context.developerToken,
      lookback_days: String(context.lookbackDays),
      google_account_email: config.google_account_email || "",
      google_auth_mode: "Google OAuth",
      customer_name: config.customer_name || "",
    },
  });

  await upsertSyncState(shopId, {
    source: "google_ads",
    resource: "daily_metrics",
    last_synced_at: syncedAt,
    status: "idle",
    cursor: null,
    error_message: null,
  });

  return {
    ok: true,
    customer_id: context.customerId,
    synced_rows: dailyRows.length,
    synced_at: syncedAt,
    start,
    end,
  };
}

function buildGoogleAdsContext(config) {
  const refreshToken = String(config.refresh_token || "").trim();
  const customerId = normalizeCustomerId(config.customer_id || "");
  const loginCustomerId = normalizeCustomerId(config.login_customer_id || "");
  const developerToken = String(config.developer_token || "").trim();
  const lookbackDays = Math.max(1, Number(config.lookback_days || config.sync_interval || DEFAULT_LOOKBACK_DAYS));

  if (!refreshToken) {
    const error = new Error("Google Ads 尚未完成 Google OAuth 授权");
    error.details = {
      fix: "请先在集成设置的 Google Ads 卡片中点击“连接 Google”。",
    };
    throw error;
  }

  if (!customerId) {
    const error = new Error("Missing Google Ads Customer ID");
    error.details = { fix: "请在 Google Ads 卡片中填写广告账号 ID（Customer ID）。" };
    throw error;
  }

  if (!developerToken) {
    const error = new Error("Missing Google Ads Developer Token");
    error.details = { fix: "请在 Google Ads 卡片中填写 Developer Token。" };
    throw error;
  }

  return {
    refreshToken,
    customerId,
    loginCustomerId,
    developerToken,
    lookbackDays,
  };
}

async function fetchGoogleAdsCustomer(accessToken, context, limitOne = false) {
  const rows = await runGoogleAdsQuery(
    accessToken,
    context,
    `SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer ${limitOne ? "LIMIT 1" : ""}`,
  );
  return rows[0] || {};
}

async function runGoogleAdsQuery(accessToken, context, query) {
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${context.customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "developer-token": context.developerToken,
      ...(context.loginCustomerId ? { "login-customer-id": context.loginCustomerId } : {}),
    },
    body: JSON.stringify({ query: compactQuery(query) }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("Google Ads query failed");
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  const batches = Array.isArray(payload) ? payload : [payload];
  return batches.flatMap((batch) => batch?.results || []);
}

function compactQuery(query) {
  return String(query || "").replace(/\s+/g, " ").trim();
}

function mapGoogleAdsDailyRows(shopId, rows) {
  return rows.map((row) => ({
    shop_id: shopId,
    source: "google_ads",
    day: row.segments?.date || null,
    campaign_id: String(row.campaign?.id || ""),
    campaign_name: row.campaign?.name || "Unknown campaign",
    spend: round(number(row.metrics?.costMicros) / 1_000_000),
    impressions: number(row.metrics?.impressions),
    clicks: number(row.metrics?.clicks),
    purchases: Math.round(number(row.metrics?.conversions)),
    revenue: round(number(row.metrics?.conversionsValue)),
    raw: row,
  })).filter((row) => row.day && row.campaign_id);
}

async function getGoogleAccessTokenFromRefreshToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    const error = new Error("Failed to refresh Google OAuth access token");
    error.details = body;
    throw error;
  }

  return body.access_token;
}

async function resolveShopId(config) {
  const integrations = await supabaseFetch(
    "/rest/v1/data_integrations?source=eq.shopify&select=shop_id&limit=1",
  );
  if (integrations[0]?.shop_id) return integrations[0].shop_id;

  const shops = await supabaseFetch("/rest/v1/shops?select=id&order=created_at.asc&limit=1");
  if (shops[0]?.id) return shops[0].id;

  const fallbackDomain = String(config.shop_domain || process.env.SHOPIFY_SHOP_DOMAIN || `google-ads-${Date.now()}.local`).trim();
  await supabaseFetch("/rest/v1/shops", {
    method: "POST",
    headers: { prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify([{ shop_domain: fallbackDomain, shop_name: "Google Ads Data Source" }]),
  });
  const created = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(fallbackDomain)}&select=id&limit=1`,
  );
  if (!created[0]?.id) {
    const error = new Error("Failed to resolve shop for Google Ads data");
    error.statusCode = 500;
    throw error;
  }
  return created[0].id;
}

async function getIntegrationConfig(source) {
  const rows = await supabaseFetch(
    `/rest/v1/data_integrations?source=eq.${encodeURIComponent(source)}&select=id,shop_id,config,status,last_connected_at,last_tested_at,last_synced_at&limit=1`,
  );
  return rows[0]?.config || {};
}

async function touchIntegration(source, patch) {
  const current = await supabaseFetch(
    `/rest/v1/data_integrations?source=eq.${encodeURIComponent(source)}&select=id,config,status,last_connected_at,last_tested_at,last_synced_at&limit=1`,
  );
  const row = current[0] || {};
  const mergedConfig = {
    ...(row.config || {}),
    ...(patch.config || {}),
  };
  const payload = {
    source,
    status: patch.status || row.status || "connected",
    config: mergedConfig,
    last_connected_at: patch.last_connected_at ?? row.last_connected_at ?? null,
    last_tested_at: patch.last_tested_at ?? row.last_tested_at ?? null,
    last_synced_at: patch.last_synced_at ?? row.last_synced_at ?? null,
  };

  if (row.id) {
    await supabaseFetch(`/rest/v1/data_integrations?id=eq.${row.id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
    return;
  }

  await supabaseFetch("/rest/v1/data_integrations", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify([payload]),
  });
}

async function upsertSyncState(shopId, patch) {
  const resource = patch.resource || "daily_metrics";
  const existing = await supabaseFetch(
    `/rest/v1/sync_state?shop_id=eq.${encodeURIComponent(shopId)}&source=eq.${encodeURIComponent(patch.source)}&resource=eq.${encodeURIComponent(resource)}&select=id&limit=1`,
  );

  const row = {
    shop_id: shopId,
    source: patch.source,
    resource,
    last_synced_at: patch.last_synced_at || null,
    cursor: patch.cursor || null,
    status: patch.status || "idle",
    error_message: patch.error_message || null,
  };

  if (existing[0]?.id) {
    await supabaseFetch(`/rest/v1/sync_state?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    return;
  }

  await supabaseFetch("/rest/v1/sync_state", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify([row]),
  });
}

async function upsertBatch(table, rows, conflictKeys) {
  if (!rows.length) return;
  await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictKeys)}`, {
    method: "POST",
    headers: {
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
}

function normalizeCustomerId(value) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

function toDateOnly(value) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function number(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(number(value) * 100) / 100;
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
