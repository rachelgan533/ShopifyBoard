const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SEARCH_CONSOLE_API_BASE = "https://www.googleapis.com/webmasters/v3";
const DEFAULT_LOOKBACK_DAYS = 30;

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();

    const mode = req.query?.mode === "test" ? "test" : "sync";
    const result = mode === "test" ? await testSearchConsoleConnection() : await syncSearchConsole();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Search Console sync failed",
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

async function testSearchConsoleConnection() {
  const config = await getIntegrationConfig("search_console");
  const context = buildSearchConsoleContext(config);
  const accessToken = await getGoogleAccessTokenFromRefreshToken(context.refreshToken);
  const report = await querySearchConsole(context.siteUrl, accessToken, {
    startDate: offsetDateString(7),
    endDate: offsetDateString(1),
    dimensions: ["date"],
    rowLimit: 1,
  });
  const testedAt = new Date().toISOString();

  await touchIntegration("search_console", {
    status: "connected",
    last_connected_at: testedAt,
    last_tested_at: testedAt,
    config: {
      site_url: context.siteUrl,
      lookback_days: String(context.lookbackDays),
      google_account_email: config.google_account_email || "",
      google_auth_mode: "Google OAuth",
      auth_mode: "oauth",
    },
  });

  return {
    ok: true,
    site_url: context.siteUrl,
    sample_rows: report.rows?.length || 0,
  };
}

async function syncSearchConsole() {
  const config = await getIntegrationConfig("search_console");
  const context = buildSearchConsoleContext(config);
  const accessToken = await getGoogleAccessTokenFromRefreshToken(context.refreshToken);
  const shopId = await resolveShopId(config);
  const syncedAt = new Date().toISOString();
  const start = offsetDateString(context.lookbackDays - 1);
  const end = offsetDateString(1);

  const reportTypes = [
    { dimensionType: "summary", dimensions: ["date"], rowLimit: 1000 },
    { dimensionType: "query", dimensions: ["date", "query"], rowLimit: 25000 },
    { dimensionType: "page", dimensions: ["date", "page"], rowLimit: 25000 },
    { dimensionType: "country", dimensions: ["date", "country"], rowLimit: 25000 },
    { dimensionType: "device", dimensions: ["date", "device"], rowLimit: 25000 },
  ];

  const allRows = [];
  for (const reportType of reportTypes) {
    const report = await querySearchConsole(context.siteUrl, accessToken, {
      startDate: start,
      endDate: end,
      dimensions: reportType.dimensions,
      rowLimit: reportType.rowLimit,
      aggregationType: reportType.dimensions.includes("page") ? "byPage" : "auto",
      type: "web",
    });
    allRows.push(...mapSearchConsoleRows(shopId, context.siteUrl, reportType.dimensionType, report.rows || []));
  }

  await clearSearchConsoleMetrics(shopId, context.siteUrl);
  await upsertBatch("search_console_metrics", allRows, "shop_id,site_url,day,dimension_type,dimension_value");

  await touchIntegration("search_console", {
    status: "connected",
    last_connected_at: syncedAt,
    last_tested_at: syncedAt,
    last_synced_at: syncedAt,
    config: {
      site_url: context.siteUrl,
      lookback_days: String(context.lookbackDays),
      google_account_email: config.google_account_email || "",
      google_auth_mode: "Google OAuth",
      auth_mode: "oauth",
    },
  });

  await upsertSyncState(shopId, {
    source: "search_console",
    resource: "daily_metrics",
    last_synced_at: syncedAt,
    status: "idle",
    cursor: null,
    error_message: null,
  });

  return {
    ok: true,
    site_url: context.siteUrl,
    synced_rows: allRows.length,
    synced_at: syncedAt,
    start,
    end,
  };
}

function buildSearchConsoleContext(config) {
  const refreshToken = String(config.refresh_token || "").trim();
  const siteUrl = String(config.site_url || "").trim();
  const lookbackDays = Math.max(1, Number(config.lookback_days || config.sync_interval || DEFAULT_LOOKBACK_DAYS));

  if (!refreshToken) {
    const error = new Error("Search Console 尚未完成 Google OAuth 授权");
    error.details = { fix: "请先在集成设置的 Search Console 卡片中点击“连接 Google”。" };
    throw error;
  }
  if (!siteUrl) {
    const error = new Error("Missing Search Console Site URL");
    error.details = { fix: "请先填写 Site URL，例如 sc-domain:example.com 或 https://www.example.com/。" };
    throw error;
  }

  return { refreshToken, siteUrl, lookbackDays };
}

async function querySearchConsole(siteUrl, accessToken, body) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(`${GOOGLE_SEARCH_CONSOLE_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(describeSearchConsoleError(payload, "Search Console query failed"));
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

function mapSearchConsoleRows(shopId, siteUrl, dimensionType, rows) {
  return rows.map((row) => {
    const keys = row.keys || [];
    const day = keys[0] || null;
    const dimensionValue = keys[1] || "all";
    return {
      shop_id: shopId,
      site_url: siteUrl,
      day,
      dimension_type: dimensionType,
      dimension_value: dimensionValue,
      clicks: round(number(row.clicks)),
      impressions: round(number(row.impressions)),
      ctr: round(number(row.ctr) * 100),
      position: round(number(row.position)),
      raw: row,
    };
  }).filter((row) => row.day);
}

async function clearSearchConsoleMetrics(shopId, siteUrl) {
  await supabaseFetch(
    `/rest/v1/search_console_metrics?shop_id=eq.${encodeURIComponent(shopId)}&site_url=eq.${encodeURIComponent(siteUrl)}`,
    {
      method: "DELETE",
      headers: { prefer: "return=minimal" },
    },
  );
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
    const error = new Error(body.error_description || body.error || "Failed to refresh Google OAuth access token");
    error.details = body;
    throw error;
  }
  return body.access_token;
}

async function resolveShopId(config) {
  const integrations = await supabaseFetch("/rest/v1/data_integrations?source=eq.shopify&select=shop_id&limit=1");
  if (integrations[0]?.shop_id) return integrations[0].shop_id;
  const shops = await supabaseFetch("/rest/v1/shops?select=id&order=created_at.asc&limit=1");
  if (shops[0]?.id) return shops[0].id;

  const fallbackDomain = String(config.shop_domain || process.env.SHOPIFY_SHOP_DOMAIN || `search-console-${Date.now()}.local`).trim();
  await supabaseFetch("/rest/v1/shops", {
    method: "POST",
    headers: { prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify([{ shop_domain: fallbackDomain, shop_name: "Search Console Data Source" }]),
  });
  const created = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(fallbackDomain)}&select=id&limit=1`,
  );
  if (!created[0]?.id) {
    const error = new Error("Failed to resolve shop for Search Console data");
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
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

function describeSearchConsoleError(payload, fallback) {
  const error = payload?.error || {};
  const message = String(error.message || payload?.message || "").toLowerCase();
  if (message.includes("insufficient permission") || message.includes("permission")) {
    return "当前 Google 账号没有访问该 Search Console 资源的权限";
  }
  if (message.includes("site not found") || message.includes("not a verified")) {
    return "Search Console Site URL 不可用，请确认资源已验证且填写正确";
  }
  if (message.includes("invalid grant") || message.includes("token")) {
    return "Google OAuth 授权失效，请重新连接 Google";
  }
  return error.message || fallback;
}

function offsetDateString(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Number(daysAgo || 0));
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
