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
const GOOGLE_ADS_API_VERSION = String(process.env.GOOGLE_ADS_API_VERSION || "v24").trim();
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const GOOGLE_SEARCH_CONSOLE_API_BASE = "https://www.googleapis.com/webmasters/v3";

module.exports = async function handler(req, res) {
  let source = "ga4";
  try {
    assertSupabaseEnv();

    const code = String(req.query?.code || "").trim();
    const state = String(req.query?.state || "").trim();
    const oauthError = String(req.query?.error || "").trim();
    const oauthErrorDescription = String(req.query?.error_description || "").trim();
    const baseUrl = getBaseUrl(req);

    if (oauthError) {
      const payload = safeReadState(state);
      return redirect(res, buildRedirectUrl(baseUrl, {
        oauth_status: "error",
        oauth_source: payload?.source || "ga4",
        oauth_message: oauthErrorDescription || oauthError,
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
    if (!["ga4", "google_ads", "search_console"].includes(payload.source)) {
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

      let accountProfile;
      try {
        accountProfile = await queryGoogleAdsCustomer({
          accessToken,
          developerToken,
          customerId,
          loginCustomerId,
        });
      } catch (error) {
        const diagnosis = await diagnoseGoogleAdsValidationError({
          accessToken,
          developerToken,
          customerId,
          loginCustomerId,
          originalError: error,
        });
        return redirect(res, buildRedirectUrl(baseUrl, {
          oauth_status: "error",
          oauth_source: "google_ads",
          oauth_message:
            diagnosis ||
            describeGoogleOauthCallbackError(error.details) ||
            error.message ||
            "Google Ads 账号校验失败",
        }));
      }

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
    } else if (source === "search_console") {
      const siteUrl = String(integration?.config?.site_url || "").trim();
      if (!siteUrl) {
        return redirect(res, buildRedirectUrl(baseUrl, {
          oauth_status: "error",
          oauth_source: "search_console",
          oauth_message: "请先在集成设置中填写并保存 Search Console 的 Site URL",
        }));
      }

      await querySearchConsole(siteUrl, accessToken, {
        startDate: offsetDateString(7),
        endDate: offsetDateString(1),
        dimensions: ["date"],
        rowLimit: 1,
      });

      await touchIntegration("search_console", {
        status: "connected",
        last_connected_at: syncedAt,
        last_tested_at: syncedAt,
        config: {
          auth_mode: "oauth",
          refresh_token: refreshToken,
          google_account_email: profile.email || integration?.config?.google_account_email || "",
          google_auth_mode: "Google OAuth",
          site_url: siteUrl,
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
            : source === "search_console"
              ? "Search Console 已完成 Google 授权"
            : "GA4 已完成 Google 授权",
    }));
  } catch (error) {
    return redirect(res, buildRedirectUrl(getBaseUrl(req), {
      oauth_status: "error",
      oauth_source: source,
      oauth_message:
        describeGoogleOauthCallbackError(error.details) ||
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

  const requestId = response.headers.get("request-id") || response.headers.get("google-ads-request-id") || "";
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = raw ? { raw } : {};
  }
  if (!response.ok) {
    const error = new Error("Google Ads account validation failed");
    error.statusCode = response.status;
    error.details = {
      ...(payload && typeof payload === "object" && !Array.isArray(payload) ? payload : { payload }),
      _request_id: requestId,
      _raw: raw ? raw.slice(0, 500) : "",
      _http_status: response.status,
    };
    throw error;
  }

  const firstBatch = Array.isArray(payload) ? payload[0] : payload;
  const firstResult = firstBatch?.results?.[0];
  return firstResult || {};
}

async function diagnoseGoogleAdsValidationError({ accessToken, developerToken, customerId, loginCustomerId, originalError }) {
  const primary = describeGoogleOauthCallbackError(originalError?.details);
  if (!loginCustomerId) return primary;

  try {
    await queryGoogleAdsCustomer({
      accessToken,
      developerToken,
      customerId,
      loginCustomerId: "",
    });
    return `Login Customer ID ${loginCustomerId} 可能填错了：去掉 MCC 后可以访问该广告账户。请留空重试，或改成实际发起访问的经理账号 ID（无横杠）`;
  } catch (retryError) {
    const retryDiagnosis = describeGoogleOauthCallbackError(retryError?.details);
    if (retryDiagnosis && retryDiagnosis !== primary) {
      return `${primary || "Google Ads 账号校验失败"}；补充诊断：${retryDiagnosis}`;
    }
  }

  return primary;
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
    const error = new Error("Search Console query failed");
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

function normalizeGoogleAdsCustomerId(value) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

function describeGoogleOauthCallbackError(details) {
  const topLevelMessage = details?.error?.message || details?.message || "";
  const nested = (details?.error?.details || [])
    .flatMap((detail) => detail?.errors || [])
    .map((item) => item?.message)
    .filter(Boolean);
  const codes = (details?.error?.details || [])
    .flatMap((detail) => detail?.errors || [])
    .flatMap((item) => Object.values(item?.errorCode || {}))
    .filter(Boolean);
  const nestedMessage = nested[0] || "";
  const codeMessage = codes[0] || "";
  const combined = [topLevelMessage, ...nested, ...codes].join(" | ").toLowerCase();

  if (combined.includes("developer token")) {
    return "Google Ads Developer Token 无效、未获批，或当前账号不可用";
  }
  if (combined.includes("test account")) {
    return "当前 Google Ads Developer Token 还只能访问测试账号，不能访问真实广告账户";
  }
  if (combined.includes("redirect_uri_mismatch")) {
    return "Google OAuth 回调地址不匹配：请在 Google Cloud OAuth 客户端里加入当前站点的 /api/oauth/google/callback";
  }
  if (combined.includes("invalid_client")) {
    return "Google OAuth Client ID 或 Client Secret 无效，请检查 Vercel 环境变量和 Google Cloud OAuth 客户端配置";
  }
  if (combined.includes("unauthorized_client")) {
    return "当前 Google OAuth 客户端未被允许发起此授权，请检查 OAuth 客户端类型、测试用户和回调地址配置";
  }
  if (combined.includes("access_denied")) {
    return "Google 授权被拒绝：可能是你取消了授权，或当前账号未被加入 OAuth 测试用户";
  }
  if (combined.includes("login-customer-id")) {
    return "Login Customer ID 不正确，请检查 MCC 经理账号";
  }
  if (combined.includes("user_permission_denied") || combined.includes("authorizationerror.user_permission_denied")) {
    return "当前 Google 账号没有访问该 Google Ads 账户；如果你是通过 MCC 授权，请填写 Login Customer ID（经理账号 ID，无横杠）";
  }
  if (combined.includes("customer_not_enabled") || combined.includes("customer not found")) {
    return "Google Ads Customer ID 不可用，请确认账号已启用且填写正确";
  }
  if (combined.includes("permission_denied") || combined.includes("does not have sufficient permissions")) {
    return "GA4 权限不足：请确认当前 Google 账号有该 GA4 媒体资源的查看者或管理员权限";
  }
  if (combined.includes("property") && (combined.includes("not found") || combined.includes("invalid") || combined.includes("does not exist"))) {
    return "GA4 Property ID 无效：请填写媒体资源 ID，不是账号 ID";
  }
  if (combined.includes("analyticsdata.googleapis.com") || combined.includes("has not been used") || combined.includes("disabled")) {
    return "Google Analytics Data API 未启用：请在 Google Cloud 项目中启用该 API 后重试";
  }
  if (combined.includes("ga4 runreport failed")) {
    return "GA4 runReport 失败，请确认 Property ID 正确且当前账号有该媒体资源权限";
  }
  if (combined.includes("search console query failed")) {
    return "Search Console 查询失败，请确认 Site URL 正确且当前 Google 账号有该资源权限";
  }

  if (combined.includes("google ads account validation failed")) {
    return nestedMessage || codeMessage || "Google Ads 账号校验失败，请检查 Customer ID、Developer Token、账号权限，以及是否需要填写 Login Customer ID（MCC）";
  }

  if (details?._raw) {
    const compactRaw = String(details._raw).replace(/\s+/g, " ").trim();
    if (compactRaw) {
      return `Google Ads 账号校验失败：${compactRaw}${details._request_id ? `（request id: ${details._request_id}）` : ""}`;
    }
  }

  return nestedMessage || codeMessage || topLevelMessage || "";
}

function safeReadState(rawState) {
  try {
    return verifySignedState(rawState);
  } catch {
    return null;
  }
}

function offsetDateString(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Number(daysAgo || 0));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("location", location);
  res.end();
}
