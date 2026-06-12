const {
  GOOGLE_TOKEN_URL,
  assertSupabaseEnv,
  getGoogleOAuthConfig,
  verifySignedState,
  getBaseUrl,
  getIntegration,
  touchIntegration,
  buildRedirectUrl,
  fetchGoogleUserInfo,
} = require("./_shared");

const GOOGLE_GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const GOOGLE_ADS_API_BASE = "https://googleads.googleapis.com/v19";

module.exports = async function handler(req, res) {
  let source = "ga4";
  try {
    assertSupabaseEnv();

    const code = String(req.query?.code || "").trim();
    const state = String(req.query?.state || "").trim();
    const oauthError = String(req.query?.error || "").trim();
    const baseUrl = getBaseUrl(req);

    if (oauthError) {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: "ga4",
        oauth_message: oauthError,
      }));
    }

    if (!code || !state) {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: "ga4",
        oauth_message: "缺少 Google 授权返回参数",
      }));
    }

    const payload = verifySignedState(state);
    if (!["ga4", "google_ads"].includes(payload.source)) {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: payload.source || "ga4",
        oauth_message: "授权来源不匹配",
      }));
    }

    source = payload.source;
    const integration = await getIntegration(source);

    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(req);
    const tokens = await exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri });
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token || integration?.config?.refresh_token || "";
    if (!refreshToken) {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: source,
        oauth_message: "Google 未返回 refresh token，请重新发起连接并确认已勾选离线访问",
      }));
    }

    const profile = await fetchGoogleUserInfo(accessToken).catch(() => ({}));
    const syncedAt = new Date().toISOString();

    if (source === "ga4") {
      const propertyId = String(integration?.config?.property_id || "").trim();
      if (!propertyId) {
        return redirect(res, buildRedirectUrl(baseUrl, {
          oauth_status: "error",
          oauth_source: "ga4",
          oauth_message: "请先在集成设置中填写并保存 GA4 Property ID",
        }));
      }

      await runGa4Report(propertyId, accessToken, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        limit: "1",
      });

      await touchIntegration("ga4", {
        status: "connected",
        last_connected_at: syncedAt,
        last_tested_at: syncedAt,
        config: {
          auth_mode: "oauth",
          refresh_token: refreshToken,
          google_account_email: profile.email || integration?.config?.google_account_email || "",
          google_auth_mode: "Google OAuth",
        },
      });
    } else if (source === "google_ads") {
      const customerId = normalizeGoogleAdsCustomerId(integration?.config?.customer_id || "");
      const developerToken = String(integration?.config?.developer_token || "").trim();
      const loginCustomerId = normalizeGoogleAdsCustomerId(integration?.config?.login_customer_id || "");
      if (!customerId || !developerToken) {
        return redirect(res, buildRedirectUrl(baseUrl, {
          oauth_status: "error",
          oauth_source: "google_ads",
          oauth_message: "请先在集成设置中填写并保存 Google Ads 的 Customer ID 和 Developer Token",
        }));
      }

      const accountProfile = await queryGoogleAdsCustomer({
        accessToken,
        developerToken,
        customerId,
        loginCustomerId,
      });

      await touchIntegration("google_ads", {
        status: "connected",
        last_connected_at: syncedAt,
        last_tested_at: syncedAt,
        config: {
          auth_mode: "oauth",
          refresh_token: refreshToken,
          google_account_email: profile.email || integration?.config?.google_account_email || "",
          google_auth_mode: "Google OAuth",
          customer_name:
            accountProfile.customer?.descriptiveName ||
            accountProfile.customer?.resourceName ||
            integration?.config?.customer_name ||
            "",
        },
      });
    }

    return redirect(res, buildRedirectUrl(baseUrl, {
      oauth_status: "connected",
      oauth_source: source,
      oauth_message:
        profile.email
          ? `已绑定 ${profile.email}`
          : source === "google_ads"
            ? "Google Ads 已完成 Google 授权"
            : "GA4 已完成 Google 授权",
    }));
  } catch (error) {
    return redirect(res, buildRedirectUrl(getBaseUrl(req), {
      oauth_status: "error",
      oauth_source: source,
      oauth_message:
        error.details?.error?.message ||
        error.details?.message ||
        error.details?.error_description ||
        error.message ||
        "GA4 Google 授权失败",
    }));
  }
};

async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri }) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    const error = new Error("Google OAuth token exchange failed");
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
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
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

async function queryGoogleAdsCustomer({ accessToken, developerToken, customerId, loginCustomerId }) {
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "developer-token": developerToken,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
    },
    body: JSON.stringify({
      query: "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("Google Ads account validation failed");
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  const firstBatch = Array.isArray(payload) ? payload[0] : payload;
  const firstResult = firstBatch?.results?.[0];
  return firstResult || {};
}

function normalizeGoogleAdsCustomerId(value) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("location", location);
  res.end();
}
