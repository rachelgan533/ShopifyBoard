const crypto = require("crypto");

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v23.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const DEFAULT_LOOKBACK_DAYS = 30;

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();

    const mode = req.query?.mode === "test" ? "test" : "sync";
    const result = mode === "test" ? await testMetaAdsConnection() : await syncMetaAds();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Meta Ads sync failed",
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

async function testMetaAdsConnection() {
  const config = await getIntegrationConfig("meta_ads");
  const context = buildMetaAdsContext(config);
  const account = await fetchMetaAdAccount(context);
  const testedAt = new Date().toISOString();

  await touchIntegration("meta_ads", {
    status: "connected",
    last_connected_at: testedAt,
    last_tested_at: testedAt,
    config: {
      app_id: context.appId || "",
      app_secret: context.appSecret || "",
      ad_account_id: context.adAccountId,
      access_token: context.accessToken,
      lookback_days: String(context.lookbackDays),
      auth_mode: "manual_token",
      account_name: account.name || config.account_name || "",
      account_currency: account.currency || config.account_currency || "",
    },
  });

  return {
    ok: true,
    ad_account_id: context.adAccountId,
    account_name: account.name || "",
  };
}

async function syncMetaAds() {
  const config = await getIntegrationConfig("meta_ads");
  const context = buildMetaAdsContext(config);
  const shopId = await resolveShopId(config);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (context.lookbackDays - 1));
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const syncedAt = new Date().toISOString();

  const rows = await fetchMetaInsights(context, {
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values",
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since: start, until: end }),
    limit: "500",
  });

  const dailyRows = mapMetaAdsDailyRows(shopId, rows);
  await upsertBatch("ad_daily_metrics", dailyRows, "shop_id,source,day,campaign_id");

  const audienceDay = end;
  const segmentRows = [];
  const skippedSegments = [];
  const breakdowns = [
    ["gender", "gender", "reach"],
    ["age", "age", "reach"],
    ["country", "country", "reach"],
    ["device", "impression_device", "reach"],
    ["channel", "publisher_platform", "reach"],
  ];

  for (const [segmentType, breakdown, metric] of breakdowns) {
    try {
      const segmentData = await fetchMetaInsights(context, {
        fields: metric,
        level: "account",
        breakdowns: breakdown,
        time_range: JSON.stringify({ since: start, until: end }),
        limit: "500",
      });
      segmentRows.push(...mapMetaAudienceRows(shopId, segmentType, audienceDay, segmentData));
    } catch (error) {
      skippedSegments.push({
        segment_type: segmentType,
        message: error.message,
      });
    }
  }

  await clearAudienceSegments(shopId, "meta_ads", audienceDay);
  await upsertBatch("audience_segments", segmentRows, "shop_id,source,segment_type,segment_name,day");

  const account = await fetchMetaAdAccount(context).catch(() => ({}));

  await touchIntegration("meta_ads", {
    status: "connected",
    last_connected_at: syncedAt,
    last_tested_at: syncedAt,
    last_synced_at: syncedAt,
    config: {
      app_id: context.appId || "",
      app_secret: context.appSecret || "",
      ad_account_id: context.adAccountId,
      access_token: context.accessToken,
      lookback_days: String(context.lookbackDays),
      auth_mode: "manual_token",
      account_name: account.name || config.account_name || "",
      account_currency: account.currency || config.account_currency || "",
    },
  });

  await upsertSyncState(shopId, {
    source: "meta_ads",
    resource: "daily_metrics",
    last_synced_at: syncedAt,
    status: "idle",
    cursor: null,
    error_message: skippedSegments.length ? JSON.stringify(skippedSegments) : null,
  });

  return {
    ok: true,
    ad_account_id: context.adAccountId,
    account_name: account.name || "",
    synced_rows: dailyRows.length,
    synced_segment_rows: segmentRows.length,
    skipped_segments: skippedSegments,
    synced_at: syncedAt,
    start,
    end,
  };
}

function buildMetaAdsContext(config) {
  const accessToken = String(config.access_token || "").trim();
  const adAccountId = normalizeAdAccountId(config.ad_account_id || "");
  const appId = String(config.app_id || "").trim();
  const appSecret = String(config.app_secret || "").trim();
  const lookbackDays = Math.max(1, Number(config.lookback_days || config.sync_interval || DEFAULT_LOOKBACK_DAYS));

  if (!accessToken) {
    const error = new Error("Missing Meta Ads Access Token");
    error.details = { fix: "请在 Meta Ads 卡片中填写 System User Access Token。" };
    throw error;
  }
  if (!adAccountId) {
    const error = new Error("Missing Meta Ads Ad Account ID");
    error.details = { fix: "请在 Meta Ads 卡片中填写广告账户 ID。" };
    throw error;
  }

  return {
    accessToken,
    adAccountId,
    appId,
    appSecret,
    lookbackDays,
  };
}

async function fetchMetaAdAccount(context) {
  return fetchMetaObject(context, `/act_${context.adAccountId}`, {
    fields: "id,name,account_status,currency,timezone_name",
  });
}

async function fetchMetaInsights(context, params) {
  return fetchMetaCollection(context, `/act_${context.adAccountId}/insights`, params);
}

async function fetchMetaObject(context, path, params = {}) {
  const response = await fetch(buildMetaUrl(path, withAuthParams(context, params)));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const error = new Error(describeMetaError(payload, "Meta Ads request failed"));
    error.statusCode = response.status || 500;
    error.details = payload;
    throw error;
  }
  return payload;
}

async function fetchMetaCollection(context, path, params = {}) {
  let url = buildMetaUrl(path, withAuthParams(context, params));
  const rows = [];
  let page = 0;

  while (url && page < 20) {
    const response = await fetch(url);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      const error = new Error(describeMetaError(payload, "Meta Ads query failed"));
      error.statusCode = response.status || 500;
      error.details = payload;
      throw error;
    }
    rows.push(...(payload.data || []));
    url = payload.paging?.next || null;
    page += 1;
  }

  return rows;
}

function buildMetaUrl(path, params) {
  const url = new URL(`${META_GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function withAuthParams(context, params) {
  const query = {
    ...params,
    access_token: context.accessToken,
  };
  if (context.appSecret) {
    query.appsecret_proof = crypto
      .createHmac("sha256", context.appSecret)
      .update(context.accessToken)
      .digest("hex");
  }
  return query;
}

function mapMetaAdsDailyRows(shopId, rows) {
  return rows
    .map((row) => ({
      shop_id: shopId,
      source: "meta_ads",
      day: row.date_start || null,
      campaign_id: String(row.campaign_id || ""),
      campaign_name: row.campaign_name || "Unknown campaign",
      spend: round(number(row.spend)),
      impressions: number(row.impressions),
      clicks: number(row.clicks),
      purchases: sumMetaActionMetric(row.actions, ["purchase", "offsite_conversion.purchase", "omni_purchase"]),
      revenue: round(sumMetaActionMetric(row.action_values, ["purchase", "offsite_conversion.purchase", "omni_purchase"])),
      raw: row,
    }))
    .filter((row) => row.day && row.campaign_id);
}

function mapMetaAudienceRows(shopId, segmentType, day, rows) {
  const grouped = new Map();
  for (const row of rows || []) {
    const rawName = String(
      row[segmentType === "device" ? "impression_device" : segmentType === "channel" ? "publisher_platform" : segmentType] || "",
    ).trim();
    if (!rawName || rawName.toLowerCase() === "unknown") continue;
    const value = number(row.reach || row.impressions || 0);
    if (value <= 0) continue;
    grouped.set(rawName, (grouped.get(rawName) || 0) + value);
  }

  const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(grouped.entries())
    .map(([name, users]) => ({
      shop_id: shopId,
      source: "meta_ads",
      segment_type: segmentType,
      segment_name: name,
      users,
      percentage: total ? round((users / total) * 100) : 0,
      day,
      raw: { segment_type: segmentType, segment_name: name, users },
    }))
    .sort((left, right) => right.users - left.users);
}

async function clearAudienceSegments(shopId, source, day) {
  await supabaseFetch(
    `/rest/v1/audience_segments?shop_id=eq.${encodeURIComponent(shopId)}&source=eq.${encodeURIComponent(source)}&day=eq.${encodeURIComponent(day)}`,
    {
      method: "DELETE",
      headers: { prefer: "return=minimal" },
    },
  );
}

function sumMetaActionMetric(rows, types) {
  const wanted = new Set(types);
  return (rows || []).reduce((sum, row) => {
    if (!wanted.has(String(row.action_type || ""))) return sum;
    return sum + number(row.value);
  }, 0);
}

async function resolveShopId(config) {
  const integrations = await supabaseFetch("/rest/v1/data_integrations?source=eq.shopify&select=shop_id&limit=1");
  if (integrations[0]?.shop_id) return integrations[0].shop_id;

  const shops = await supabaseFetch("/rest/v1/shops?select=id&order=created_at.asc&limit=1");
  if (shops[0]?.id) return shops[0].id;

  const fallbackDomain = String(config.shop_domain || process.env.SHOPIFY_SHOP_DOMAIN || `meta-ads-${Date.now()}.local`).trim();
  await supabaseFetch("/rest/v1/shops", {
    method: "POST",
    headers: { prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify([{ shop_domain: fallbackDomain, shop_name: "Meta Ads Data Source" }]),
  });
  const created = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(fallbackDomain)}&select=id&limit=1`,
  );
  if (!created[0]?.id) {
    const error = new Error("Failed to resolve shop for Meta Ads data");
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

function normalizeAdAccountId(value) {
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

function describeMetaError(payload, fallback) {
  const error = payload?.error || {};
  const combined = [
    error.message,
    error.error_user_title,
    error.error_user_msg,
    error.type,
    error.code,
    error.error_subcode,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (combined.includes("invalid oauth access token") || combined.includes("error validating access token")) {
    return "Meta Access Token 无效或已过期，请重新生成 System User Token";
  }
  if (combined.includes("permissions") || combined.includes("not authorized") || combined.includes("requires business_management")) {
    return "当前 Meta Token 没有读取该广告账户数据的权限";
  }
  if (combined.includes("unsupported get request") || combined.includes("does not exist")) {
    return "Meta 广告账户 ID 不可用，请检查 Ad Account ID 是否正确";
  }
  if (combined.includes("application does not have the capability")) {
    return "Meta 应用当前没有 Marketing API 能力，请检查应用权限和业务验证状态";
  }

  return error.error_user_msg || error.message || fallback;
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
