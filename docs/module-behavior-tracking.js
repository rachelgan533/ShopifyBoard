(function () {
  const config = {
    endpoint: window.BOHEALTHY_BEHAVIOR_ENDPOINT || "https://shopify-boardweb.vercel.app/api/behavior-events",
    writeKey: window.BOHEALTHY_BEHAVIOR_WRITE_KEY || "",
    shopDomain: window.Shopify?.shop || window.BOHEALTHY_SHOP_DOMAIN || location.hostname,
    debug: Boolean(window.BOHEALTHY_BEHAVIOR_DEBUG),
  };

  const visitorId = getStoredId("bohealthy_visitor_id", localStorage, "v");
  const sessionId = getStoredId("bohealthy_session_id", sessionStorage, "s");
  const seenModules = new Set();

  function getStoredId(key, storage, prefix) {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const value = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    storage.setItem(key, value);
    return value;
  }

  function pageType() {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.includes("/products/")) return "product";
    if (path.includes("/collections/")) return "collection";
    if (path.includes("/cart")) return "cart";
    if (path.includes("/search")) return "search";
    if (path.includes("/checkout")) return "checkout";
    return "other";
  }

  function modulePayload(element) {
    return {
      module_id: element.dataset.trackModule,
      module_type: element.dataset.moduleType || "module",
      module_name: element.dataset.moduleName || element.dataset.trackModule,
      module_position: element.dataset.modulePosition || "",
      module_variant: element.dataset.moduleVariant || "",
      product_id: element.dataset.productId || window.meta?.product?.id || "",
      variant_id: element.dataset.variantId || "",
    };
  }

  function track(eventName, payload = {}) {
    const body = {
      shop_domain: config.shopDomain,
      event_name: eventName,
      event_time: new Date().toISOString(),
      session_id: sessionId,
      user_pseudo_id: visitorId,
      page_url: location.pathname + location.search,
      page_type: pageType(),
      referrer: document.referrer,
      ...payload,
    };

    if (config.debug) console.log("[boHealthy behavior]", body);

    fetch(config.endpoint, {
      method: "POST",
      keepalive: true,
      headers: {
        "content-type": "application/json",
        "x-behavior-write-key": config.writeKey,
      },
      body: JSON.stringify(body),
    }).catch((error) => {
      if (config.debug) console.warn("[boHealthy behavior failed]", error);
    });
  }

  function observeModuleViews() {
    const modules = Array.from(document.querySelectorAll("[data-track-module]"));
    if (!modules.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
          const element = entry.target;
          const moduleId = element.dataset.trackModule;
          if (!moduleId || seenModules.has(moduleId)) return;
          seenModules.add(moduleId);
          track("module_view", modulePayload(element));
        });
      },
      { threshold: [0.5] },
    );

    modules.forEach((element) => observer.observe(element));
  }

  document.addEventListener("click", (event) => {
    const element = event.target.closest("[data-track-module]");
    if (!element) return;
    track("module_click", modulePayload(element));
  });

  document.addEventListener("submit", (event) => {
    const element = event.target.closest("[data-track-module]");
    if (!element) return;
    track("module_submit", {
      ...modulePayload(element),
      search_term: element.querySelector('input[type="search"], input[name="q"]')?.value || "",
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    track("page_view");
    observeModuleViews();
  });

  window.boHealthyTrackModule = track;
})();
