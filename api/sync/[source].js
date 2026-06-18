const handlers = {
  coupons: require("../../server/sync/coupons.js"),
  ga4: require("../../server/sync/ga4.js"),
  "google-ads": require("../../server/sync/google-ads.js"),
  "meta-ads": require("../../server/sync/meta-ads.js"),
  "search-console": require("../../server/sync/search-console.js"),
  "shopify-orders": require("../../server/sync/shopify-orders.js"),
  status: require("../../server/sync/status.js"),
};

module.exports = async function handler(req, res) {
  const source = String(req.query?.source || "").trim();
  const target = handlers[source];

  if (!target) {
    return res.status(404).json({
      error: "Unknown sync endpoint",
      details: {
        source,
        supported: Object.keys(handlers),
      },
    });
  }

  return target(req, res);
};
