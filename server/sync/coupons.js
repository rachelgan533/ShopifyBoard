module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();

    const orders = await supabaseFetch(
      "/rest/v1/orders?select=shop_id,discount_codes&order=created_at.desc&limit=5000",
    );
    const byShopAndCode = new Map();

    for (const order of orders) {
      for (const code of order.discount_codes || []) {
        const normalized = String(code || "").trim();
        if (!normalized) continue;
        const key = `${order.shop_id}:${normalized}`;
        const item = byShopAndCode.get(key) || {
          shop_id: order.shop_id,
          code: normalized,
          category: guessCouponCategory(normalized),
          owner: guessCouponOwner(normalized),
          usage_count: 0,
          status: "启用",
        };
        item.usage_count += 1;
        byShopAndCode.set(key, item);
      }
    }

    const rows = [...byShopAndCode.values()];
    if (rows.length) {
      await supabaseFetch("/rest/v1/coupon_codes?on_conflict=shop_id,code", {
        method: "POST",
        headers: { prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      });
    }

    return res.status(200).json({
      ok: true,
      scanned_orders: orders.length,
      synced_coupons: rows.length,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Coupon sync failed",
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

  return body || [];
}

function guessCouponCategory(code) {
  const upper = code.toUpperCase();
  if (upper.includes("WELCOME") || upper.includes("NEW")) return "新人券";
  if (upper.includes("SITE") || upper.includes("SALE") || upper.includes("BFCM")) return "站内活动券";
  return "达人券";
}

function guessCouponOwner(code) {
  return code.replace(/[-_ ]?(WELCOME|NEW|BFCM|SALE|DISCOUNT|OFF)$/i, "") || code;
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}
