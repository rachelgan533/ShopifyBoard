module.exports = async function handler(req, res) {
  try {
    assertEnv();

    if (req.method === "GET") {
      const [rows, shops] = await Promise.all([
        supabaseFetch("/rest/v1/data_integrations?select=id,source,status,config,last_connected_at,last_tested_at,last_synced_at,updated_at&order=source.asc"),
        supabaseFetch("/rest/v1/shops?select=id,shop_domain,shop_name&order=updated_at.desc&limit=1"),
      ]);
      return res.status(200).json({
        ok: true,
        integrations: rows.map((row) => ({
          ...row,
          config: redactConfig(row.config || {}),
        })),
        primary_shop: shops[0] || null,
      });
    }

    if (req.method === "POST") {
      assertAuthorized(req);
      const body = await readJson(req);
      const source = String(body.source || "").trim();
      if (!source) return res.status(400).json({ error: "Missing source" });

      const current = await getIntegration(source);
      const currentConfig = current?.config || {};
      const nextConfig = normalizeSourceConfig(
        source,
        mergeConfig(currentConfig, body.config || {}, body.clear_keys || []),
      );
      const shopId = source === "shopify" ? await upsertPrimaryShop(nextConfig) : current?.shop_id || null;
      const row = {
        ...(shopId ? { shop_id: shopId } : {}),
        source,
        status: body.status || current?.status || "configured",
        config: nextConfig,
        last_connected_at: new Date().toISOString(),
      };

      if (current?.id) {
        await supabaseFetch(`/rest/v1/data_integrations?id=eq.${current.id}`, {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify(row),
        });
      } else {
        await supabaseFetch("/rest/v1/data_integrations", {
          method: "POST",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify(row),
        });
      }

      return res.status(200).json({
        ok: true,
        source,
        config: redactConfig(nextConfig),
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Integration request failed",
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

async function getIntegration(source) {
  const rows = await supabaseFetch(
    `/rest/v1/data_integrations?source=eq.${encodeURIComponent(source)}&select=id,shop_id,config&limit=1`,
  );
  return rows[0] || null;
}

async function upsertPrimaryShop(config) {
  const shopDomain = String(config.shop_domain || "").trim();
  const shopName = String(config.shop_name || "").trim();
  if (!shopDomain && !shopName) return null;

  const domain = shopDomain || `manual-${Date.now()}.local`;
  await supabaseFetch("/rest/v1/shops?on_conflict=shop_domain", {
    method: "POST",
    headers: {
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        shop_domain: domain,
        shop_name: shopName || domain,
      },
    ]),
  });

  const rows = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(domain)}&select=id,shop_name&limit=1`,
  );
  return rows[0]?.id || null;
}

function mergeConfig(current, incoming, clearKeys = []) {
  const next = { ...current };
  for (const key of clearKeys) {
    delete next[key];
  }
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text || text === "********" || text.includes("已保存")) continue;
    next[key] = text;
  }
  return next;
}

function normalizeSourceConfig(source, config) {
  const next = { ...config };

  if (source === "ga4") {
    const propertyId = String(next.property_id || "").trim();
    if (propertyId) next.property_id = propertyId.replace(/^properties\//, "");
    const lookbackDays = Number(next.lookback_days || next.sync_interval || 30);
    next.lookback_days = String(Math.max(1, lookbackDays));

    const authMode = String(next.auth_mode || "").trim().toLowerCase();
    if (authMode === "oauth") {
      next.google_auth_mode = "Google OAuth";
      delete next.service_account_json;
      return next;
    }

    const jsonText = String(next.service_account_json || "").trim();
    if (jsonText && !jsonText.includes("已保存")) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.client_email) next.google_account_email = parsed.client_email;
        if (parsed.project_id) next.google_project_id = parsed.project_id;
      } catch {
        // Let sync/test surface JSON validation errors.
      }
    }
    return next;
  }

  if (source === "google_ads") {
    next.customer_id = String(next.customer_id || "").replace(/[^\d]/g, "").trim();
    next.login_customer_id = String(next.login_customer_id || "").replace(/[^\d]/g, "").trim();
    const lookbackDays = Number(next.lookback_days || 30);
    next.lookback_days = String(Math.max(1, lookbackDays));
    if (String(next.auth_mode || "").trim().toLowerCase() === "oauth") {
      next.google_auth_mode = "Google OAuth";
    }
    return next;
  }

  if (source === "search_console") {
    next.site_url = String(next.site_url || "").trim();
    const lookbackDays = Number(next.lookback_days || 30);
    next.lookback_days = String(Math.max(1, lookbackDays));
    if (String(next.auth_mode || "").trim().toLowerCase() === "oauth") {
      next.google_auth_mode = "Google OAuth";
    }
    return next;
  }

  if (source === "meta_ads") {
    next.app_id = String(next.app_id || "").trim();
    next.ad_account_id = String(next.ad_account_id || "").replace(/[^\d]/g, "").trim();
    const lookbackDays = Number(next.lookback_days || 30);
    next.lookback_days = String(Math.max(1, lookbackDays));
    if (next.access_token) next.auth_mode = "manual_token";
    return next;
  }

  return next;
}

function redactConfig(config) {
  const redacted = { ...config };
  for (const key of Object.keys(redacted)) {
    if (/secret|token|key/i.test(key) || key === "service_account_json") {
      redacted[key] = redacted[key] ? "已保存，留空则不修改" : "";
    }
  }
  return redacted;
}

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
