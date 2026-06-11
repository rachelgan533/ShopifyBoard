const crypto = require("crypto");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GOOGLE_GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const DEFAULT_LOOKBACK_DAYS = 30;

const AUDIENCE_REPORTS = [
  { dimension: "userGender", segmentType: "gender", limit: 10 },
  { dimension: "userAgeBracket", segmentType: "age", limit: 10 },
  { dimension: "brandingInterest", segmentType: "interest", limit: 25 },
  { dimension: "language", segmentType: "language", limit: 20 },
  { dimension: "country", segmentType: "country", limit: 20 },
  { dimension: "city", segmentType: "city", limit: 20 },
  { dimension: "deviceCategory", segmentType: "device", limit: 10 },
];

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();

    const mode = req.query?.mode === "test" ? "test" : "sync";
    const result = mode === "test" ? await testGa4Connection() : await syncGa4();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "GA4 sync failed",
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
  const missing = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

async function testGa4Connection() {
  const config = await getIntegrationConfig("ga4");
  const propertyId = normalizePropertyId(config.property_id || process.env.GA4_PROPERTY_ID);
  const authContext = resolveGa4AuthContext(config);
  const accessToken = await getGoogleAccessToken(authContext);

  const report = await runGa4Report(propertyId, accessToken, {
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    limit: "1",
  });

  await touchIntegration("ga4", {
    status: "connected",
    last_tested_at: new Date().toISOString(),
    last_connected_at: new Date().toISOString(),
    config: {
      auth_mode: authContext.mode,
      property_id: propertyId,
      google_account_email: authContext.accountEmail || config.google_account_email || "",
      google_project_id: authContext.projectId || config.google_project_id || "",
      google_auth_mode: authContext.mode === "oauth" ? "Google OAuth" : "Service Account",
      lookback_days: String(Math.max(1, Number(config.lookback_days || DEFAULT_LOOKBACK_DAYS))),
    },
  });

  return {
    ok: true,
    property_id: propertyId,
    service_account: authContext.accountEmail || "OAuth",
    sample_rows: report.rows?.length || 0,
  };
}

async function syncGa4() {
  const config = await getIntegrationConfig("ga4");
  const propertyId = normalizePropertyId(config.property_id || process.env.GA4_PROPERTY_ID);
  const authContext = resolveGa4AuthContext(config);
  const accessToken = await getGoogleAccessToken(authContext);
  const shopId = await resolveShopId(config);
  const lookbackDays = Math.max(1, Number(config.lookback_days || DEFAULT_LOOKBACK_DAYS));
  const startDate = `${lookbackDays - 1}daysAgo`;
  const endDate = "today";
  const syncedAt = new Date().toISOString();
  const audienceDay = syncedAt.slice(0, 10);

  const dailyReport = await runGa4Report(propertyId, accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }, { name: "deviceCategory" }, { name: "country" }, { name: "city" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "addToCarts" },
      { name: "checkouts" },
      { name: "ecommercePurchases" },
    ],
    limit: "100000",
  });

  const dailyRows = mapDailyMetrics(shopId, dailyReport.rows || []);
  await upsertBatch("ga4_daily_metrics", dailyRows, "shop_id,day,device,country,city");

  await supabaseFetch(
    `/rest/v1/audience_segments?source=eq.ga4&day=eq.${encodeURIComponent(audienceDay)}&select=id`,
    { method: "DELETE", headers: { prefer: "return=minimal" } },
  );

  let syncedSegmentRows = 0;
  const skippedSegments = [];

  for (const reportConfig of AUDIENCE_REPORTS) {
    try {
      const audienceReport = await runGa4Report(propertyId, accessToken, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: reportConfig.dimension }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: String(reportConfig.limit),
      });

      const rows = mapAudienceSegments(
        shopId,
        reportConfig.segmentType,
        audienceDay,
        audienceReport.rows || [],
      );

      if (rows.length) {
        await upsertBatch(
          "audience_segments",
          rows,
          "shop_id,source,segment_type,segment_name,day",
        );
        syncedSegmentRows += rows.length;
      }
    } catch (error) {
      skippedSegments.push({
        segment_type: reportConfig.segmentType,
        reason: error.message,
      });
    }
  }

  await touchIntegration("ga4", {
    status: "connected",
    last_tested_at: syncedAt,
    last_connected_at: syncedAt,
    last_synced_at: syncedAt,
    config: {
      auth_mode: authContext.mode,
      property_id: propertyId,
      google_account_email: authContext.accountEmail || config.google_account_email || "",
      google_project_id: authContext.projectId || config.google_project_id || "",
      google_auth_mode: authContext.mode === "oauth" ? "Google OAuth" : "Service Account",
      lookback_days: String(lookbackDays),
      skipped_segments: skippedSegments,
    },
  });

  await upsertSyncState(shopId, {
    source: "ga4",
    resource: "daily_metrics",
    last_synced_at: syncedAt,
    status: "idle",
    cursor: null,
    error_message: null,
  });

  return {
    ok: true,
    property_id: propertyId,
    shop_id: shopId,
    synced_daily_rows: dailyRows.length,
    synced_segment_rows: syncedSegmentRows,
    skipped_segments: skippedSegments,
    synced_at: syncedAt,
  };
}

async function resolveShopId(config) {
  const explicitDomain = config.shop_domain || process.env.SHOPIFY_SHOP_DOMAIN || null;
  if (explicitDomain) {
    const rows = await supabaseFetch(
      `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(explicitDomain)}&select=id&limit=1`,
    );
    if (rows[0]?.id) return rows[0].id;
  }

  const integrations = await supabaseFetch(
    "/rest/v1/data_integrations?source=eq.shopify&select=shop_id&limit=1",
  );
  if (integrations[0]?.shop_id) return integrations[0].shop_id;

  const shops = await supabaseFetch("/rest/v1/shops?select=id&order=created_at.asc&limit=1");
  if (shops[0]?.id) return shops[0].id;

  const fallbackShopDomain = explicitDomain || `ga4-${Date.now()}.local`;
  await supabaseFetch("/rest/v1/shops", {
    method: "POST",
    headers: { prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify([{ shop_domain: fallbackShopDomain, shop_name: "GA4 Data Source" }]),
  });
  const created = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(fallbackShopDomain)}&select=id&limit=1`,
  );
  if (!created[0]?.id) {
    const error = new Error("Failed to resolve shop for GA4 data");
    error.statusCode = 500;
    throw error;
  }
  return created[0].id;
}

function parseServiceAccount(raw) {
  if (!raw) {
    const error = new Error("Missing GA4 service account JSON");
    error.details = {
      fix: "在集成设置的 GA4 卡片中粘贴完整 Service Account JSON。",
    };
    throw error;
  }

  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    const error = new Error("GA4 service account JSON 格式不正确");
    error.details = { fix: "请粘贴从 Google Cloud 下载的完整 JSON 文件内容。" };
    throw error;
  }

  if (!parsed.client_email || !parsed.private_key) {
    const error = new Error("GA4 service account JSON 缺少 client_email 或 private_key");
    error.details = { fix: "请确认使用的是 Service Account Key JSON，而不是 OAuth 凭据。" };
    throw error;
  }

  return parsed;
}

function resolveGa4AuthContext(config) {
  const refreshToken = String(config.refresh_token || process.env.GA4_REFRESH_TOKEN || "").trim();
  const authMode = String(config.auth_mode || "").trim().toLowerCase();
  if (refreshToken || authMode === "oauth") {
    const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
    const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
    if (!clientId || !clientSecret) {
      const error = new Error("Missing Google OAuth client configuration");
      error.details = {
        fix: "请在 Vercel 环境变量中设置 GOOGLE_OAUTH_CLIENT_ID 和 GOOGLE_OAUTH_CLIENT_SECRET。",
      };
      throw error;
    }
    if (!refreshToken) {
      const error = new Error("GA4 尚未完成 Google OAuth 授权");
      error.details = {
        fix: "请先在集成设置的 GA4 卡片中点击“连接 Google”，完成授权后再测试或同步。",
      };
      throw error;
    }
    return {
      mode: "oauth",
      refreshToken,
      clientId,
      clientSecret,
      accountEmail: String(config.google_account_email || "").trim(),
      projectId: String(config.google_project_id || "").trim(),
    };
  }

  const serviceAccount = parseServiceAccount(config.service_account_json || process.env.GA4_SERVICE_ACCOUNT_JSON);
  return {
    mode: "service_account",
    serviceAccount,
    accountEmail: serviceAccount.client_email,
    projectId: serviceAccount.project_id || "",
  };
}

function normalizePropertyId(value) {
  const propertyId = String(value || "").trim();
  if (!propertyId) {
    const error = new Error("Missing GA4 Property ID");
    error.details = { fix: "在集成设置的 GA4 卡片里填写 Property ID。" };
    throw error;
  }
  return propertyId;
}

async function getGoogleAccessToken(authContext) {
  if (authContext.mode === "oauth") {
    return getGoogleAccessTokenFromRefreshToken(authContext);
  }
  const serviceAccount = authContext.serviceAccount;
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: GOOGLE_GA4_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    },
    serviceAccount.private_key,
  );

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    const error = new Error("Failed to get Google access token");
    error.details = body;
    throw error;
  }

  return body.access_token;
}

async function getGoogleAccessTokenFromRefreshToken(authContext) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: authContext.clientId,
      client_secret: authContext.clientSecret,
      refresh_token: authContext.refreshToken,
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

function signJwt(header, payload, privateKey) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(content);
  signer.end();

  const signature = signer.sign(privateKey, "base64");
  return `${content}.${signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function runGa4Report(propertyId, accessToken, body) {
  const response = await fetch(`${GOOGLE_GA4_API_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("GA4 runReport failed");
    error.details = payload;
    throw error;
  }
  return payload;
}

function mapDailyMetrics(shopId, rows) {
  return rows.map((row) => {
    const dims = row.dimensionValues || [];
    const metrics = row.metricValues || [];
    return {
      shop_id: shopId,
      day: formatGaDate(dims[0]?.value),
      device: cleanSegmentName(dims[1]?.value),
      country: cleanSegmentName(dims[2]?.value),
      city: cleanSegmentName(dims[3]?.value),
      sessions: number(metrics[0]?.value),
      users: number(metrics[1]?.value),
      add_to_carts: number(metrics[2]?.value),
      checkouts: number(metrics[3]?.value),
      purchases: number(metrics[4]?.value),
      raw: row,
    };
  });
}

function mapAudienceSegments(shopId, segmentType, day, rows) {
  const total = rows.reduce((sum, row) => sum + number(row.metricValues?.[0]?.value), 0) || 1;
  return rows
    .filter((row) => cleanSegmentName(row.dimensionValues?.[0]?.value))
    .map((row) => {
      const users = number(row.metricValues?.[0]?.value);
      return {
        shop_id: shopId,
        source: "ga4",
        segment_type: segmentType,
        segment_name: cleanSegmentName(row.dimensionValues?.[0]?.value),
        users,
        percentage: round((users / total) * 100),
        affinity: segmentType === "interest" ? users : null,
        day,
        raw: row,
      };
    });
}

function formatGaDate(value) {
  if (!value || !/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function cleanSegmentName(value) {
  const text = String(value || "").trim();
  if (!text || text === "(not set)" || text === "unknown") return null;
  return text;
}

async function touchIntegration(source, patch) {
  const current = await getIntegration(source);
  const mergedConfig = {
    ...(current?.config || {}),
    ...(patch.config || {}),
  };
  const row = {
    ...(current || {}),
    source,
    status: patch.status || current?.status || "connected",
    config: mergedConfig,
    last_connected_at: patch.last_connected_at ?? current?.last_connected_at ?? null,
    last_tested_at: patch.last_tested_at ?? current?.last_tested_at ?? null,
    last_synced_at: patch.last_synced_at ?? current?.last_synced_at ?? null,
  };

  delete row.id;
  delete row.created_at;
  delete row.updated_at;

  if (current?.id) {
    await supabaseFetch(`/rest/v1/data_integrations?id=eq.${current.id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    return;
  }

  await supabaseFetch("/rest/v1/data_integrations", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify([row]),
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

async function getIntegration(source) {
  const rows = await supabaseFetch(
    `/rest/v1/data_integrations?source=eq.${encodeURIComponent(source)}&select=id,source,status,config,last_connected_at,last_tested_at,last_synced_at,shop_id&limit=1`,
  );
  return rows[0] || null;
}

async function getIntegrationConfig(source) {
  const row = await getIntegration(source);
  return row?.config || {};
}

async function upsertBatch(table, rows, onConflict) {
  if (!rows.length) return;
  await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: {
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
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

function number(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
