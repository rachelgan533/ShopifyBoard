module.exports = async function handler(req, res) {
  try {
    assertEnv();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    assertAuthorized(req);
    const body = await readJson(req);
    const shop = await resolveShop(body);
    const events = normalizeEvents(body, shop.id);

    if (!events.length) {
      return res.status(400).json({
        error: "No behavior events to write",
        details: {
          expected: [
            "{ event_name, event_time, ... }",
            "{ shop_domain, events: [...] }",
          ],
        },
      });
    }

    await upsertBatch("user_behavior_events", events, "id");

    return res.status(200).json({
      ok: true,
      shop_id: shop.id,
      shop_domain: shop.shop_domain,
      received: events.length,
      event_names: [...new Set(events.map((event) => event.event_name))],
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Behavior events request failed",
      details: error.details,
    });
  }
};

const SUPPORTED_BEHAVIOR_EVENTS = new Set([
  "page_view",
  "view_item_list",
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "site_search",
  "filter_applied",
  "review_opened",
  "variant_selected",
  "faq_opened",
  "shipping_info_opened",
  "coupon_attempted",
  "wishlist_added",
]);

function assertEnv() {
  const missing = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function assertAuthorized(req) {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const requestKey =
    bearer ||
    req.headers["x-behavior-write-key"] ||
    req.query?.key ||
    req.query?.secret;

  const allowed = [
    process.env.BEHAVIOR_WRITE_KEY,
    process.env.CRON_SECRET,
  ].filter(Boolean);

  if (!allowed.length) return;

  if (!allowed.includes(String(requestKey || ""))) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    error.details = {
      fix: [
        "为 /api/behavior-events 请求带上 x-behavior-write-key",
        "或使用 Authorization: Bearer <BEHAVIOR_WRITE_KEY>",
        "并在 Vercel 环境变量中配置 BEHAVIOR_WRITE_KEY",
      ],
    };
    throw error;
  }
}

async function resolveShop(body) {
  const shopId = String(body.shop_id || "").trim();
  if (shopId) {
    const rows = await supabaseFetch(`/rest/v1/shops?id=eq.${encodeURIComponent(shopId)}&select=id,shop_domain,shop_name&limit=1`);
    if (rows[0]?.id) return rows[0];
  }

  const shopDomain = String(body.shop_domain || "").trim();
  if (shopDomain) {
    const rows = await supabaseFetch(
      `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(shopDomain)}&select=id,shop_domain,shop_name&limit=1`,
    );
    if (rows[0]?.id) return rows[0];
  }

  const fallback = await supabaseFetch("/rest/v1/shops?select=id,shop_domain,shop_name&order=updated_at.desc&limit=1");
  if (fallback[0]?.id) return fallback[0];

  const error = new Error("No shop found for behavior events");
  error.statusCode = 400;
  error.details = {
    fix: [
      "先在集成设置里保存 Shopify 店铺配置",
      "或在行为事件请求体里传 shop_domain / shop_id",
    ],
  };
  throw error;
}

function normalizeEvents(body, shopId) {
  const incoming = Array.isArray(body.events)
    ? body.events
    : body.event_name
      ? [body]
      : [];

  return incoming
    .map((event, index) => normalizeEvent(event, shopId, index))
    .filter(Boolean);
}

function normalizeEvent(input, shopId, index) {
  const eventName = String(input.event_name || input.event || "").trim();
  if (!eventName) return null;

  const normalizedEventName = eventName.toLowerCase();
  if (!SUPPORTED_BEHAVIOR_EVENTS.has(normalizedEventName)) {
    const error = new Error(`Unsupported behavior event: ${eventName}`);
    error.statusCode = 400;
    error.details = {
      supported: [...SUPPORTED_BEHAVIOR_EVENTS],
    };
    throw error;
  }

  const eventTime = sanitizeTimestamp(input.event_time || input.timestamp || new Date().toISOString());
  const pageUrl = trimText(input.page_url || input.page || input.location || "/");
  const pageType = trimText(input.page_type || input.page_category || "other");
  const value = number(input.value || 0);
  const eventId = trimText(input.id) || createEventId(shopId, normalizedEventName, eventTime, index, input.session_id);

  return {
    id: eventId,
    shop_id: shopId,
    event_time: eventTime,
    event_name: normalizedEventName,
    session_id: trimText(input.session_id || input.sessionId),
    user_pseudo_id: trimText(input.user_pseudo_id || input.client_id || input.user_id || input.userPseudoId),
    customer_id: trimText(input.customer_id || input.customerId),
    page_url: pageUrl,
    page_type: pageType,
    referrer: trimText(input.referrer || input.referrer_url),
    channel_primary: trimText(input.channel_primary || input.channel || input.channelPrimary || inferChannel(input)),
    device_category: trimText(input.device_category || input.device || input.deviceCategory),
    country: trimText(input.country),
    city: trimText(input.city),
    product_id: trimText(input.product_id || input.productId),
    variant_id: trimText(input.variant_id || input.variantId),
    collection_id: trimText(input.collection_id || input.collectionId),
    search_term: trimText(input.search_term || input.searchTerm),
    value,
    currency: trimText(input.currency || "USD"),
    properties: sanitizeProperties(input.properties, input),
  };
}

function sanitizeProperties(properties, input) {
  const next = { ...(properties && typeof properties === "object" ? properties : {}) };
  const allowedPassThrough = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "order_id",
    "order_name",
    "discount_codes",
    "element_name",
    "section_name",
  ];

  allowedPassThrough.forEach((key) => {
    if (input[key] !== undefined && next[key] === undefined) {
      next[key] = input[key];
    }
  });

  return next;
}

function inferChannel(input) {
  const source = String(input.channel_primary || input.channel || input.utm_source || input.source || "").toLowerCase();
  const medium = String(input.utm_medium || input.medium || "").toLowerCase();
  const referrer = String(input.referrer || input.referrer_url || "").toLowerCase();

  if (medium.includes("email") || source.includes("klaviyo")) return "edm";
  if (medium.includes("cpc") || medium.includes("paid") || source.includes("google ads") || source.includes("facebook ads")) return "ads";
  if (source.includes("affiliate") || source.includes("impact") || referrer.includes("shareasale")) return "affiliate";
  if (source.includes("instagram") || source.includes("facebook") || source.includes("tiktok")) return "sns";
  if (source.includes("google") || source.includes("bing")) return "organic";
  return "direct";
}

function createEventId(shopId, eventName, eventTime, index, sessionId) {
  const seed = `${shopId}|${eventName}|${eventTime}|${sessionId || ""}|${index}`;
  const hex = Buffer.from(seed).toString("hex").slice(0, 32).padEnd(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function sanitizeTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Invalid event_time");
    error.statusCode = 400;
    error.details = { value };
    throw error;
  }
  return date.toISOString();
}

function trimText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function upsertBatch(table, rows, conflictColumns) {
  if (!rows.length) return;
  const chunkSize = 500;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumns)}`, {
      method: "POST",
      headers: {
        prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
  }
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
