const SHOPIFY_ORDER_QUERY = `
  query OrdersForDashboard($first: Int!, $after: String, $query: String!) {
    shop {
      name
      myshopifyDomain
      currencyCode
      ianaTimezone
    }
    orders(first: $first, after: $after, sortKey: UPDATED_AT, reverse: false, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          createdAt
          updatedAt
          processedAt
          currencyCode
          displayFinancialStatus
          displayFulfillmentStatus
          sourceName
          landingPageUrl
          discountCodes
          customerJourneySummary {
            ready
            customerOrderIndex
            daysToConversion
            moments(first: 20, reverse: true) {
              nodes {
                occurredAt
                ... on CustomerVisit {
                  source
                  sourceDescription
                  sourceType
                  referrerUrl
                  landingPage
                  referralCode
                  utmParameters {
                    source
                    medium
                    campaign
                    content
                    term
                  }
                }
              }
            }
            lastVisit {
              occurredAt
              source
              sourceDescription
              sourceType
              referrerUrl
              landingPage
              referralCode
              utmParameters {
                source
                medium
                campaign
                content
                term
              }
            }
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
            }
          }
          totalTaxSet {
            shopMoney {
              amount
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
            }
          }
          totalRefundedSet {
            shopMoney {
              amount
            }
          }
          customer {
            id
            email
            firstName
            lastName
            numberOfOrders
            amountSpent {
              amount
            }
            defaultAddress {
              country
              province
              city
            }
          }
          shippingAddress {
            country
            province
            city
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                sku
                quantity
                variantTitle
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
                discountedTotalSet {
                  shopMoney {
                    amount
                  }
                }
                totalDiscountSet {
                  shopMoney {
                    amount
                  }
                }
                product {
                  id
                  title
                  handle
                  vendor
                  productType
                  status
                }
                variant {
                  id
                  title
                  sku
                }
              }
            }
          }
        }
      }
    }
  }
`;

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthorized(req);
    assertEnv();

    const mode = req.query?.mode === "test" ? "test" : "sync";
    const syncResult = await syncShopifyOrders(mode, {
      fullSync: req.query?.full === "1",
    });
    return res.status(200).json(syncResult);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Sync failed",
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
  const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

async function syncShopifyOrders(mode = "sync", options = {}) {
  const config = await getIntegrationConfig("shopify");
  const shopDomain = normalizeShopDomain(config.shop_domain || process.env.SHOPIFY_SHOP_DOMAIN);
  const first = Number(process.env.SHOPIFY_SYNC_PAGE_SIZE || 50);
  const defaultMaxPages = Number(process.env.SHOPIFY_SYNC_MAX_PAGES || 4);
  const fullSync = mode === "sync" && options.fullSync === true;
  const maxPages = fullSync
    ? Number(process.env.SHOPIFY_SYNC_FULL_MAX_PAGES || 200)
    : defaultMaxPages;
  const authInfo = await getShopifyAccessToken(shopDomain, config);
  const accessToken = authInfo.accessToken;

  const shop = await ensureShop(shopDomain, accessToken);
  const syncState = await getSyncState(shop.id);
  const updatedAfter = syncState?.last_synced_at || process.env.SHOPIFY_SYNC_START_DATE || daysAgoIso(30);
  const requiredScopes = ["read_orders", "read_customers", "read_products"];
  if (requiresAllOrdersAccess(updatedAfter)) requiredScopes.push("read_all_orders");
  await assertShopifyScopes(shopDomain, accessToken, requiredScopes, { updatedAfter });

  if (mode === "test") {
    const now = new Date().toISOString();
    await touchIntegration("shopify", {
      status: "connected",
      last_connected_at: now,
      last_tested_at: now,
      config: buildShopifyAuthConfigPatch(authInfo),
    });
    return {
      ok: true,
      shop_domain: shopDomain,
      shop_id: shop.id,
      mode: "test",
      tested_at: now,
      auth_method: authInfo.authMethod,
      auth_label: authInfo.authLabel,
    };
  }

  let cursor = syncState?.cursor || null;
  let pages = 0;
  let importedOrders = 0;
  let importedCustomers = 0;
  let importedLineItems = 0;
  let lastCursor = syncState?.cursor || null;
  let latestUpdatedAt = updatedAfter;
  let hasNextPage = false;

  while (pages < maxPages) {
    const response = await shopifyGraphql(shopDomain, accessToken, SHOPIFY_ORDER_QUERY, {
      first,
      after: cursor,
      query: `updated_at:>=${updatedAfter}`,
    });

    const ordersConnection = response.orders;
    const orders = ordersConnection.edges.map((edge) => edge.node);

    if (!orders.length) {
      await upsertSyncState(shop.id, {
        last_synced_at: latestUpdatedAt,
        cursor: null,
        status: "idle",
      });
      break;
    }

    const mapped = mapOrders(shop.id, orders);
    await upsertBatch("customers", mapped.customers, "id");
    await upsertBatch("products", mapped.products, "id");
    await upsertBatch("orders", mapped.orders, "id");
    await upsertBatch("order_line_items", mapped.lineItems, "id");

    importedOrders += mapped.orders.length;
    importedCustomers += mapped.customers.length;
    importedLineItems += mapped.lineItems.length;
    latestUpdatedAt = newestIso(latestUpdatedAt, orders.map((order) => order.updatedAt));

    pages += 1;
    cursor = ordersConnection.pageInfo.endCursor;
    hasNextPage = Boolean(ordersConnection.pageInfo.hasNextPage);
    lastCursor = hasNextPage ? cursor : null;

    await upsertSyncState(shop.id, {
      last_synced_at: latestUpdatedAt,
      cursor: lastCursor,
      status: hasNextPage ? "running" : "idle",
    });

    if (!hasNextPage) break;
  }

  const result = {
    ok: true,
    shop_domain: shopDomain,
    shop_id: shop.id,
    updated_after: updatedAfter,
    latest_updated_at: latestUpdatedAt,
    pages,
    imported_orders: importedOrders,
    imported_customers: importedCustomers,
    imported_line_items: importedLineItems,
    has_more: Boolean(hasNextPage && pages >= maxPages),
    next_cursor: lastCursor,
    resumed_from_cursor: Boolean(syncState?.cursor),
    full_sync: fullSync,
    page_size: first,
    page_limit: maxPages,
  };

  await touchIntegration("shopify", {
    status: "connected",
    last_connected_at: new Date().toISOString(),
    last_tested_at: new Date().toISOString(),
    last_synced_at: latestUpdatedAt,
    config: buildShopifyAuthConfigPatch(authInfo),
  });

  return result;
}

async function getIntegrationConfig(source) {
  const row = await getIntegrationRow(source);
  return row?.config || {};
}

async function touchIntegration(source, patch) {
  const current = await getIntegrationRow(source);
  if (!current?.id) return;

  await supabaseFetch(`/rest/v1/data_integrations?id=eq.${current.id}`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      status: patch.status || current.status || "connected",
      config: {
        ...(current.config || {}),
        ...(patch.config || {}),
      },
      last_connected_at: patch.last_connected_at ?? current.last_connected_at ?? null,
      last_tested_at: patch.last_tested_at ?? current.last_tested_at ?? null,
      last_synced_at: patch.last_synced_at ?? current.last_synced_at ?? null,
    }),
  });
}

async function getIntegrationRow(source) {
  const rows = await supabaseFetch(
    `/rest/v1/data_integrations?source=eq.${encodeURIComponent(source)}&select=id,shop_id,config,status,last_connected_at,last_tested_at,last_synced_at,updated_at&order=updated_at.desc&limit=20`,
  );
  return latestIntegration(rows);
}

function latestIntegration(rows) {
  return [...(rows || [])]
    .sort((a, b) => integrationTimestamp(b) - integrationTimestamp(a))[0] || null;
}

function integrationTimestamp(row) {
  return (
    Date.parse(row?.updated_at || row?.last_synced_at || row?.last_connected_at || row?.last_tested_at || 0) || 0
  );
}

async function getShopifyAccessToken(shopDomain, config = {}) {
  const clientId = config.client_id || process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = config.client_secret || process.env.SHOPIFY_CLIENT_SECRET;
  const adminToken = config.admin_access_token || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopDomain) {
    const error = new Error("Missing Shopify shop domain");
    error.details = { fix: "Fill Store Domain in Settings -> Integration, or set SHOPIFY_SHOP_DOMAIN in Vercel." };
    throw error;
  }

  if (clientId && clientSecret) {
    try {
      const accessToken = await getShopifyClientCredentialsToken(shopDomain, clientId, clientSecret);
      return {
        accessToken,
        authMethod: "client_credentials",
        authLabel: "Client Credentials",
      };
    } catch (error) {
      if (adminToken && adminToken.trim()) {
        return {
          accessToken: adminToken.trim(),
          authMethod: "admin_access_token",
          authLabel: "Admin Access Token",
          authNote: "Client Credentials 失败后自动回退",
        };
      }

      error.details = {
        ...(error.details || {}),
        fallback: "当前没有可用的 SHOPIFY_ADMIN_ACCESS_TOKEN 可回退",
      };
      throw error;
    }
  }

  if (adminToken) {
    return {
      accessToken: adminToken.trim(),
      authMethod: "admin_access_token",
      authLabel: "Admin Access Token",
    };
  }

  const error = new Error("Missing Shopify credentials");
  error.details = {
    fix: "Fill Client ID and Client Secret in Settings -> Integration, or set SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET in Vercel.",
  };
  throw error;
}

function buildShopifyAuthConfigPatch(authInfo = {}) {
  return {
    last_auth_method: String(authInfo.authMethod || "").trim(),
    last_auth_label: String(authInfo.authLabel || "").trim(),
    last_auth_note: String(authInfo.authNote || "").trim(),
    last_auth_at: new Date().toISOString(),
  };
}

async function getShopifyClientCredentialsToken(shopDomain, clientId, clientSecret) {
  const url = `https://${shopDomain}/admin/oauth/access_token`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  const requestId = response.headers.get("x-request-id") || "";
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text ? { raw: text } : {};
  }
  if (!response.ok || !body.access_token) {
    const error = new Error("Failed to get Shopify access token");
    error.details = {
      ...body,
      request_id: requestId,
      fix: describeShopifyAccessTokenFailure(body, {
        shopDomain,
      }),
    };
    throw error;
  }

  return body.access_token;
}

function describeShopifyAccessTokenFailure(details, context = {}) {
  const combined = [
    details?.error,
    details?.error_description,
    details?.message,
    details?.raw,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (combined.includes("application_cannot_be_found")) {
    return [
      `请确认当前店铺 ${context.shopDomain || ""} 安装的就是这组 Client ID / Client Secret 对应的 Shopify app`,
      "去 Shopify Dev Dashboard 重新复制一次 Client ID 和 Client Secret",
      "确认这个 app 已在当前店铺安装，而不是装在别的店铺",
    ];
  }

  if (combined.includes("invalid_client") || combined.includes("invalid client")) {
    return [
      "Client ID 或 Client Secret 无效，请去 Shopify Dev Dashboard 重新复制后保存",
      "如果你刚轮换过 secret，需要把新 secret 更新到这里",
    ];
  }

  if (combined.includes("unauthorized_client")) {
    return [
      "这个 app 当前不能对该店铺使用 client_credentials",
      "确认 app 属于你自己的组织，并且安装在你自己拥有的店铺上",
    ];
  }

  if (combined.includes("forbidden") || combined.includes("access denied")) {
    return [
      "Shopify 拒绝了这次 token 请求",
      "确认 app 已发布当前版本，并且当前店铺已重新安装或更新授权",
    ];
  }

  return [
    "请确认 Shopify app 已在当前店铺安装",
    "确认 Shopify Dev Dashboard 中当前版本已发布，并且 scopes 正确",
    "重新复制 Client ID 和 Client Secret 后保存，再重试",
  ];
}

async function ensureShop(shopDomain, accessToken) {
  const query = `
    query ShopInfo {
      shop {
        name
        myshopifyDomain
        currencyCode
        ianaTimezone
      }
    }
  `;
  const { shop } = await shopifyGraphql(shopDomain, accessToken, query, {});
  const shopRow = {
    shop_domain: shop.myshopifyDomain || shopDomain,
    shop_name: shop.name,
    currency: shop.currencyCode || "USD",
    timezone: shop.ianaTimezone || "UTC",
  };

  await upsertBatch("shops", [shopRow], "shop_domain");
  const rows = await supabaseFetch(
    `/rest/v1/shops?shop_domain=eq.${encodeURIComponent(shopRow.shop_domain)}&select=id,shop_domain&limit=1`,
  );

  if (!rows[0]) throw new Error("Failed to create or read shop row");
  return rows[0];
}

async function assertShopifyScopes(shopDomain, accessToken, requiredScopes, context = {}) {
  const query = `
    query CurrentAppScopes {
      currentAppInstallation {
        accessScopes {
          handle
        }
      }
    }
  `;

  let scopes = [];
  try {
    const data = await shopifyGraphql(shopDomain, accessToken, query, {});
    scopes = data.currentAppInstallation?.accessScopes?.map((scope) => scope.handle) || [];
  } catch (error) {
    return;
  }

  const missing = requiredScopes.filter((scope) => !scopes.includes(scope));
  if (missing.length) {
    const fix = [
      "打开 Shopify Dev Dashboard",
      "进入当前这个应用",
      "打开 Configuration / Admin API integration",
      "补齐缺少的 scopes",
      "保存配置",
      "回到店铺里重新安装或更新应用授权",
      "重新部署 Vercel 后再试一次同步",
    ];
    if (missing.includes("read_all_orders")) {
      fix.unshift(
        `当前同步起点是 ${context.updatedAfter || "较早日期"}，已经早于最近 60 天`,
        "先在 Shopify Partner Dashboard -> Apps -> API access 申请 read_all_orders 权限",
      );
    }
    const error = new Error("Shopify app is missing required Admin API scopes");
    error.statusCode = 403;
    error.details = {
      missing_scopes: missing,
      current_scopes: scopes,
      updated_after: context.updatedAfter || null,
      fix,
    };
    throw error;
  }
}

async function getSyncState(shopId) {
  const rows = await supabaseFetch(
    `/rest/v1/sync_state?shop_id=eq.${shopId}&source=eq.shopify&resource=eq.orders&select=last_synced_at,cursor,status&limit=1`,
  );
  return rows[0] || null;
}

async function upsertSyncState(shopId, values) {
  await upsertBatch(
    "sync_state",
    [
      {
        shop_id: shopId,
        source: "shopify",
        resource: "orders",
        ...values,
        error_message: null,
      },
    ],
    "shop_id,source,resource",
  );
}

function mapOrders(shopId, orders) {
  const customers = new Map();
  const products = new Map();
  const orderRows = [];
  const lineItems = [];

  for (const order of orders) {
    const customer = order.customer;
    const address = customer?.defaultAddress || order.shippingAddress || {};

    if (customer?.id) {
      customers.set(customer.id, {
        id: customer.id,
        shop_id: shopId,
        email: customer.email,
        first_name: customer.firstName,
        last_name: customer.lastName,
        orders_count: numberOrZero(customer.numberOfOrders),
        total_spent: money(customer.amountSpent),
        country: address.country,
        province: address.province,
        city: address.city,
        raw: customer,
        synced_at: new Date().toISOString(),
      });
    }

    orderRows.push({
      id: order.id,
      shop_id: shopId,
      name: order.name,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      processed_at: order.processedAt,
      currency: order.currencyCode || moneyCurrency(order.totalPriceSet),
      total_price: money(order.totalPriceSet),
      subtotal_price: money(order.subtotalPriceSet),
      total_tax: money(order.totalTaxSet),
      total_discounts: money(order.totalDiscountsSet),
      total_refunded: money(order.totalRefundedSet),
      financial_status: order.displayFinancialStatus,
      fulfillment_status: order.displayFulfillmentStatus,
      customer_id: customer?.id,
      customer_email: customer?.email,
      customer_country: order.shippingAddress?.country || address.country,
      customer_province: order.shippingAddress?.province || address.province,
      customer_city: order.shippingAddress?.city || address.city,
      source_name: order.sourceName,
      landing_site: order.customerJourneySummary?.lastVisit?.landingPage || order.landingPageUrl,
      referring_site: order.customerJourneySummary?.lastVisit?.referrerUrl || null,
      discount_codes: order.discountCodes || [],
      raw: order,
      synced_at: new Date().toISOString(),
    });

    for (const edge of order.lineItems.edges) {
      const item = edge.node;
      const product = item.product;

      if (product?.id) {
        products.set(product.id, {
          id: product.id,
          shop_id: shopId,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          product_type: product.productType,
          status: product.status,
          raw: product,
          synced_at: new Date().toISOString(),
        });
      }

      lineItems.push({
        id: item.id,
        shop_id: shopId,
        order_id: order.id,
        product_id: product?.id,
        variant_id: item.variant?.id,
        sku: item.sku || item.variant?.sku,
        title: item.title,
        variant_title: item.variantTitle || item.variant?.title,
        quantity: numberOrZero(item.quantity),
        price: money(item.originalUnitPriceSet),
        total_discount: money(item.totalDiscountSet),
        raw: item,
      });
    }
  }

  return {
    customers: [...customers.values()],
    products: [...products.values()],
    orders: orderRows,
    lineItems,
  };
}

async function shopifyGraphql(shopDomain, accessToken, query, variables) {
  const version = process.env.SHOPIFY_API_VERSION || "2026-04";
  const response = await fetch(`https://${shopDomain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-access-token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.errors) {
    const error = new Error("Shopify GraphQL request failed");
    error.statusCode = response.status || 500;
    error.details = body.errors || body;
    if (Array.isArray(body.errors) && body.errors.some((item) => item?.extensions?.code === "ACCESS_DENIED")) {
      error.statusCode = 403;
      error.details = {
        shopify_errors: body.errors,
        likely_fix: [
          "去 Shopify Dev Dashboard -> Configuration -> Admin API integration，确认已开启 read_orders",
          "如果要读取客户和商品字段，还要保留 read_customers 与 read_products",
          "保存 scope 后，回到店铺里重新安装或更新这个应用授权",
          "重新部署 Vercel，确保同步函数拿到最新代码和环境变量",
        ],
      };
    }
    throw error;
  }

  return body.data;
}

async function upsertBatch(table, rows, onConflict) {
  if (!rows.length) return;
  const normalizedRows = normalizeBatchRows(rows);
  await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: {
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(normalizedRows),
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

  return body;
}

function money(value) {
  return Number(value?.shopMoney?.amount ?? value?.amount ?? 0);
}

function moneyCurrency(value) {
  return value?.shopMoney?.currencyCode;
}

function numberOrZero(value) {
  return Number(value || 0);
}

function normalizeBatchRows(rows) {
  const keys = [...rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set())];

  return rows.map((row) => {
    const normalized = {};
    for (const key of keys) {
      const value = row?.[key];
      normalized[key] = value === undefined ? null : value;
    }
    return normalized;
  });
}

function normalizeShopDomain(value) {
  const domain = String(value || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim();

  if (!domain) return "";
  if (!domain.includes(".")) return `${domain}.myshopify.com`;
  return domain;
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

function daysAgoIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function requiresAllOrdersAccess(updatedAfter) {
  const timestamp = new Date(updatedAfter).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const sixtyDaysAgo = new Date(daysAgoIso(60)).getTime();
  return timestamp < sixtyDaysAgo;
}

function newestIso(current, values) {
  const timestamps = [current, ...values].filter(Boolean).map((value) => new Date(value).getTime());
  return new Date(Math.max(...timestamps)).toISOString();
}
