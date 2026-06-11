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

module.exports = async function handler(req, res) {
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
    if (payload.source !== "ga4") {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: "ga4",
        oauth_message: "授权来源不匹配",
      }));
    }

    const integration = await getIntegration("ga4");
    const propertyId = String(integration?.config?.property_id || "").trim();
    if (!propertyId) {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: "ga4",
        oauth_message: "请先在集成设置中填写并保存 GA4 Property ID",
      }));
    }

    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(req);
    const tokens = await exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri });
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token || integration?.config?.refresh_token || "";
    if (!refreshToken) {
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: "ga4",
        oauth_message: "Google 未返回 refresh token，请重新发起连接并确认已勾选离线访问",
      }));
    }

    await runGa4Report(propertyId, accessToken, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      limit: "1",
    });

    const profile = await fetchGoogleUserInfo(accessToken).catch(() => ({}));
    const syncedAt = new Date().toISOString();

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

    return redirect(res, buildRedirectUrl(baseUrl, {
      oauth_status: "connected",
      oauth_source: "ga4",
      oauth_message: profile.email ? `已绑定 ${profile.email}` : "GA4 已完成 Google 授权",
    }));
  } catch (error) {
    return redirect(res, buildRedirectUrl(getBaseUrl(req), {
      oauth_status: "error",
      oauth_source: "ga4",
      oauth_message: error.details?.error_description || error.message || "GA4 Google 授权失败",
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

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("location", location);
  res.end();
}
