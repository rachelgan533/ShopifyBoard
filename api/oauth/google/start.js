const {
  GOOGLE_AUTH_URL,
  GOOGLE_GA4_SCOPE,
  GOOGLE_ADS_SCOPE,
  GOOGLE_IDENTITY_SCOPES,
  DEFAULT_RETURN_PATH,
  assertAuthorized,
  assertSupabaseEnv,
  getGoogleOAuthConfig,
  createSignedState,
  getIntegration,
} = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertSupabaseEnv();

    const body = await readJson(req);
    const source = String(body.source || "").trim() || "ga4";
    if (!["ga4", "google_ads"].includes(source)) {
      return res.status(400).json({ error: "Unsupported OAuth source" });
    }

    const integration = await getIntegration(source);
    if (source === "ga4") {
      const propertyId = String(integration?.config?.property_id || "").trim();
      if (!propertyId) {
        return res.status(400).json({
          error: "Missing GA4 Property ID",
          details: {
            fix: "请先在 GA4 卡片里填写 Property ID 并保存配置，再发起 Google 授权。",
          },
        });
      }
    }

    if (source === "google_ads") {
      const customerId = String(integration?.config?.customer_id || "").trim();
      const developerToken = String(integration?.config?.developer_token || "").trim();
      if (!customerId || !developerToken) {
        return res.status(400).json({
          error: "Missing Google Ads configuration",
          details: {
            fix: [
              "请先在 Google Ads 卡片里填写 Customer ID",
              "请填写 Developer Token",
              "保存配置后再发起 Google 授权",
            ],
          },
        });
      }
    }

    const { clientId, redirectUri } = getGoogleOAuthConfig(req);
    const state = createSignedState({
      source,
      ts: Date.now(),
      returnPath: DEFAULT_RETURN_PATH,
    });

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      [
        source === "google_ads" ? GOOGLE_ADS_SCOPE : GOOGLE_GA4_SCOPE,
        ...GOOGLE_IDENTITY_SCOPES,
      ].join(" "),
    );
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return res.status(200).json({
      ok: true,
      auth_url: authUrl.toString(),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to start Google OAuth",
      details: error.details,
    });
  }
};

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
