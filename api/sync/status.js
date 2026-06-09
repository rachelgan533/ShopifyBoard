module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();
    const source = req.query.source || "shopify";
    const resource = req.query.resource || "orders";
    const rows = await supabaseFetch(
      `/rest/v1/sync_state?source=eq.${encodeURIComponent(source)}&resource=eq.${encodeURIComponent(resource)}&select=source,resource,last_synced_at,cursor,status,error_message,updated_at&limit=20`,
    );

    return res.status(200).json({ ok: true, rows });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to read sync status",
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

  return body;
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}
