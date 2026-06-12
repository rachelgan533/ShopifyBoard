const crypto = require("crypto");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"];
const DEFAULT_RETURN_PATH = "/settings/integration";

module.exports = {
  GOOGLE_AUTH_URL,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  GOOGLE_GA4_SCOPE,
  GOOGLE_ADS_SCOPE,
  GOOGLE_IDENTITY_SCOPES,
  DEFAULT_RETURN_PATH,
  assertAuthorized,
  assertSupabaseEnv,
  getGoogleOAuthConfig,
  createSignedState,
  verifySignedState,
  getBaseUrl,
  supabaseFetch,
  getIntegration,
  touchIntegration,
  buildRedirectUrl,
  fetchGoogleUserInfo,
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

function assertSupabaseEnv() {
  const missing = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function getGoogleOAuthConfig(req) {
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  const redirectUri = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || "").trim() || `${getBaseUrl(req)}/api/oauth/google/callback`;

  if (!clientId || !clientSecret) {
    const error = new Error("Missing Google OAuth client configuration");
    error.statusCode = 500;
    error.details = {
      fix: [
        "在 Vercel 环境变量中添加 GOOGLE_OAUTH_CLIENT_ID",
        "在 Vercel 环境变量中添加 GOOGLE_OAUTH_CLIENT_SECRET",
        `在 Google Cloud OAuth 客户端里加入回调地址：${redirectUri}`,
      ],
    };
    throw error;
  }

  return { clientId, clientSecret, redirectUri };
}

function createSignedState(payload) {
  const data = base64Url(JSON.stringify(payload));
  const signature = sign(data);
  return `${data}.${signature}`;
}

function verifySignedState(value) {
  const raw = String(value || "");
  const [data, signature] = raw.split(".");
  if (!data || !signature || sign(data) !== signature) {
    const error = new Error("Invalid OAuth state");
    error.statusCode = 400;
    throw error;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(data));
  } catch {
    const error = new Error("OAuth state payload is malformed");
    error.statusCode = 400;
    throw error;
  }

  const issuedAt = Number(payload.ts || 0);
  if (!issuedAt || Date.now() - issuedAt > 15 * 60 * 1000) {
    const error = new Error("OAuth state has expired");
    error.statusCode = 400;
    throw error;
  }

  return payload;
}

function buildRedirectUrl(baseUrl, params = {}) {
  const url = new URL(DEFAULT_RETURN_PATH, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function getBaseUrl(req) {
  const protoHeader = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const protocol = protoHeader || "https";
  const host = hostHeader;
  if (!host) {
    const error = new Error("Unable to determine app base URL");
    error.statusCode = 500;
    throw error;
  }
  return `${protocol}://${host}`;
}

async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("Failed to fetch Google user profile");
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

async function getIntegration(source) {
  const rows = await supabaseFetch(
    `/rest/v1/data_integrations?source=eq.${encodeURIComponent(source)}&select=id,source,status,config,last_connected_at,last_tested_at,last_synced_at,shop_id&limit=1`,
  );
  return rows[0] || null;
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

function sign(value) {
  return crypto
    .createHmac("sha256", process.env.CRON_SECRET || process.env.SUPABASE_SECRET_KEY)
    .update(value)
    .digest("base64url");
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(String(value || ""), "base64url").toString("utf8");
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}
