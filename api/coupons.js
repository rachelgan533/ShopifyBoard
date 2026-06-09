module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertEnv();
    const rows = await supabaseFetch(
      "/rest/v1/coupon_codes?select=id,code,category,owner,usage_count,status&order=usage_count.desc&limit=500",
    );
    return res.status(200).json({ ok: true, coupons: rows });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to load coupons",
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

async function supabaseFetch(path) {
  const response = await fetch(`${trimSlash(process.env.SUPABASE_URL)}${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      "content-type": "application/json",
    },
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
