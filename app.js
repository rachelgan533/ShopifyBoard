const routes = {
  "/": "northstar",
  "/personas": "personas",
  "/operations": "operations",
  "/marketing": "marketing",
  "/customers": "customers",
  "/aarrr": "aarrr",
  "/settings/goals": "goals",
  "/settings/integration": "integration",
  "/settings/coupons": "coupons",
};

const pageMeta = {
  northstar: ["北极星看板", "近 30 天 · Shopify 真实数据 · 运营/转化排入"],
  personas: ["用户画像", "近 30 天 · 多源真实数据"],
  operations: ["运营数据看板", "近 30 天"],
  marketing: ["营销分析", "近 30 天 · 加载中..."],
  customers: ["客户分析", "近 30 天 · Shopify 真实数据"],
  aarrr: ["AARRR 分析", "近 30 天"],
  goals: ["目标设置", "长期维护经营目标，支持创建、编辑与历史追踪"],
  integration: ["集成设置", "管理 Shopify、GA4、Meta Ads 等数据源连接与同步"],
  coupons: ["优惠券设置", "管理券码分类：新人券、站内活动券、达人券"],
};

const navItems = [
  ["/", "☆", "北极星看板"],
  ["/personas", "◎", "用户画像"],
  ["/operations", "▦", "运营数据看板"],
  ["/marketing", "⚐", "营销分析"],
  ["/customers", "♧", "客户分析"],
  ["/aarrr", "⌁", "AARRR 分析"],
];

const settingsItems = [
  ["/settings/goals", "◎", "目标设置", "目标管理"],
  ["/settings/integration", "♁", "集成设置", "数据源连接 · 同步"],
  ["/settings/coupons", "⌘", "优惠券设置", "券码分类 · 同步订单"],
];

const metricSeries = [
  28, 42, 19, 35, 26, 30, 31, 27, 34, 29, 33, 31, 28, 38, 25, 32, 29, 27, 31,
  24, 16,
];

const spikySeries = [
  22, 65, 24, 70, 18, 66, 25, 20, 21, 20, 20, 21, 19, 19, 20, 20, 20, 20, 20,
  20,
];

const trendSeries = [
  38, 48, 58, 74, 64, 28, 39, 54, 65, 58, 22, 34, 50, 82, 84, 31, 45, 57, 48,
  73, 20, 37, 55, 71, 64, 29, 44,
];

const countryRows = [
  ["美国", "1,306", "US$246,370.21", "US$188.64", "96.18%"],
  ["英国", "35", "US$6,098.49", "US$174.24", "2.38%"],
  ["加拿大", "8", "US$1,611.37", "US$201.42", "0.63%"],
  ["德国", "6", "US$825.74", "US$137.62", "0.32%"],
  ["法国", "3", "US$550.14", "US$183.38", "0.21%"],
  ["澳大利亚", "2", "US$342.95", "US$171.48", "0.13%"],
  ["荷兰", "1", "US$180.03", "US$180.03", "0.07%"],
  ["PT", "1", "US$175.05", "US$175.05", "0.07%"],
];

const productRows = [
  ["经典皮革托特包", "39", "US$3,112.52"],
  ["陶瓷马克杯套装", "43", "US$2,747.42"],
  ["极简腕表", "67", "US$2,529.72"],
  ["无线耳机 Pro", "54", "US$2,521.78"],
  ["高级瑜伽垫", "65", "US$2,029.51"],
  ["有机棉 T 恤", "47", "US$1,221.07"],
  ["真丝眼罩", "36", "US$1,138.83"],
  ["不锈钢水杯", "27", "US$727.37"],
];

const customerValueRows = [
  ["Neikisha Francis", "ly***@yahoo.com", "1", "US$1,189.95", "US$1,189.95", "2026-06-02"],
  ["Renee Borges", "ren***@icloud.com", "3", "US$516.07", "US$516.07", "2026-05-31"],
  ["Danielle Braziel", "bra***@gmail.com", "1", "US$515.71", "US$515.71", "2026-06-09"],
  ["Harriet Wilson", "har***@gmail.com", "1", "US$466.85", "US$466.85", "2026-05-31"],
  ["Alex Ross", "ale***@gmail.com", "1", "US$459.98", "US$459.98", "2026-05-21"],
  ["Shop Rolla", "SNO***@GMAIL.COM", "2", "US$436.23", "US$436.23", "2026-06-03"],
];

const couponRows = [
  ["Zero Discount-FastBundle", "达人券", "Zero Discount-FastBundle", "0", "启用"],
  ["25BFCM25", "达人券", "25BFCM25", "2,638", "停用"],
  ["4EVR", "达人券", "4EVR", "0", "启用"],
  ["A123", "达人券", "GOAFFPRO", "2", "启用"],
  ["AARON", "达人券", "GOAFFPRO", "0", "启用"],
  ["ACC", "达人券", "ACC", "0", "启用"],
  ["AHDAN20", "达人券", "AHDAN20", "0", "启用"],
  ["AIAFFILIATETEST", "达人券", "GOAFFPRO", "0", "启用"],
  ["AJ10", "达人券", "AJ10", "0", "启用"],
  ["ALBINA15", "达人券", "ALBINA15", "0", "启用"],
  ["ALEX", "达人券", "ALEX", "0", "启用"],
  ["ALEXAPRIEGO15", "达人券", "GOAFFPRO", "2", "启用"],
  ["ARRIVALC16", "达人券", "ARRIVALC16", "14", "启用"],
  ["AUTUMN25", "达人券", "AUTUMN25", "916", "停用"],
];

const app = document.querySelector("#app");
const state = {
  storeName: "Canoly",
  range: "近 30 天",
  customRange: {
    start: "",
    end: "",
  },
  datePickerOpen: false,
  sourceTab: "总览",
  couponQuery: "",
  couponFilter: "all",
  dashboardData: null,
  dashboardDataKey: "",
  couponsData: null,
  integrationSecret: "",
  simulator: null,
  goalsData: null,
  goalForm: null,
};

function currentPage() {
  return routes[window.location.pathname] || "northstar";
}

function navigate(path) {
  history.pushState({}, "", path);
  state.sourceTab = "总览";
  render();
}

window.addEventListener("popstate", render);

function layout(content) {
  const page = currentPage();
  const [title, kicker] = pageMeta[page];
  return `
    <div class="app-shell">
      ${sidebar(page)}
      <main class="main">
        ${topbar(title, resolveKicker(kicker, page), page)}
        <div class="content">${content}</div>
        ${dateRangePicker()}
      </main>
    </div>
  `;
}

function sidebar(page) {
  const link = ([path, icon, label]) => `
    <button class="nav-item ${routes[path] === page ? "active" : ""}" data-path="${path}" title="${label}">
      <span class="nav-icon">${icon}</span><span>${label}</span>
    </button>
  `;
  const settings = settingsItems
    .map(
      ([path, icon, label, meta]) => `
        <button class="subnav-item ${routes[path] === page ? "active" : ""}" data-path="${path}">
          <span class="nav-icon">${icon}</span>
          <span>${label}<span class="subnav-meta">${meta}</span></span>
        </button>
      `,
    )
    .join("");

  return `
    <aside class="sidebar">
      <div class="brand">
      <div class="brand-mark">⌂</div>
      <div>
          <div class="brand-title" data-brand-title>${escapeHtml(state.storeName)}</div>
          <div class="brand-subtitle">Data Centre</div>
      </div>
      </div>
      <nav class="nav">
        <div class="nav-group">${navItems.map(link).join("")}</div>
        <button class="nav-item ${page.startsWith("settings") ? "active" : ""}" data-path="/settings/goals">
          <span class="nav-icon">⚙</span><span>设置</span><span style="margin-left:auto">⌄</span>
        </button>
        <div class="subnav">${settings}</div>
      </nav>
      <div class="logout">
        <button class="nav-item" data-action="logout"><span class="nav-icon">⇱</span><span>退出登录</span></button>
      </div>
    </aside>
  `;
}

function topbar(title, kicker, page) {
  const isSettings = ["goals", "integration", "coupons"].includes(page);
  return `
    <header class="topbar">
      <div>
        <div class="page-title">${title}</div>
        <div class="page-kicker">${kicker}</div>
      </div>
      <div class="top-actions">
        ${
          isSettings
            ? settingsActions(page)
            : `<div class="range-switch">
                ${["今天", "昨天", "近 7 天", "近 30 天", "自定义"].map((x) => `<button class="range-btn ${x === state.range ? "active" : ""}" data-range="${x}">${x}</button>`).join("")}
              </div>`
        }
        <div class="search"><input placeholder="搜索..." /></div>
        <button class="icon-btn" title="通知" data-action="notifications">♧</button>
        <div class="store-chip" data-store-name>${escapeHtml(state.storeName)}</div>
        <div class="avatar" data-store-avatar>${escapeHtml(initialOf(state.storeName))}</div>
      </div>
    </header>
  `;
}

function resolveKicker(kicker, page) {
  if (["northstar", "personas", "operations", "marketing", "customers", "aarrr"].includes(page)) {
    return `${activeRangeLabel()} · ${kicker.replace(/^近 30 天 · /, "").replace(/^近 30 天/, "").trim().replace(/^·\s*/, "")}`;
  }
  return kicker;
}

function activeRangeLabel() {
  if (state.range !== "自定义") return state.range;
  if (!state.customRange.start || !state.customRange.end) return "自定义";
  return `${state.customRange.start} → ${state.customRange.end}`;
}

function dateRangePicker() {
  if (!state.datePickerOpen) return "";
  return `
    <div class="date-picker-backdrop" data-action="close-date-picker"></div>
    <div class="date-picker-panel">
      <div class="date-picker-head">
        <div class="section-title">自定义时间范围</div>
        <button class="icon-btn" data-action="close-date-picker" title="关闭">×</button>
      </div>
      <div class="date-picker-grid">
        <div class="field">
          <label>开始日期</label>
          <input type="date" data-custom-start value="${state.customRange.start}" />
        </div>
        <div class="field">
          <label>结束日期</label>
          <input type="date" data-custom-end value="${state.customRange.end}" />
        </div>
      </div>
      <div class="button-row" style="justify-content:flex-end">
        <button class="ghost-btn" data-action="close-date-picker">取消</button>
        <button class="primary-btn" data-action="apply-date-range">应用</button>
      </div>
    </div>
  `;
}

function settingsActions(page) {
  if (page === "goals") return `<button class="primary-btn" data-action="new-goal">＋ 新增目标</button>`;
  if (page === "coupons")
    return `<button class="ghost-btn" data-action="sync-coupons">⟳ 同步订单分类</button><button class="primary-btn" data-action="new-coupon">＋ 新增券码</button>`;
  return "";
}

function sourceTabs(active = "总览") {
  return `
    <div class="source-tabs">
      ${["总览", "GA4", "Google Ads", "Meta Ads", "Shopify"].map((x) => `<button class="${x === active ? "active" : ""}" data-source-tab="${x}">${x}</button>`).join("")}
    </div>
  `;
}

function section(title, subtitle, tags, inner) {
  return `
    <section class="section">
      <div class="section-head">
        <div>
          <div class="section-title">${title} ${tags || ""}</div>
          ${subtitle ? `<div class="section-subtitle">${subtitle}</div>` : ""}
        </div>
      </div>
      ${inner}
    </section>
  `;
}

function pill(label, color = "") {
  return `<span class="pill ${color}">${label}</span>`;
}

function metricCard(label, value, delta = "+0.00%", source = "Shopify", series = metricSeries) {
  const down = String(delta).includes("-");
  const key = metricKey(label);
  return `
    <div class="card metric-card" ${key ? `data-series-key="${key}"` : ""}>
      <div class="metric-head">
        <div>
          <div class="metric-label">${label}</div>
          <div class="metric-value" ${key ? `data-metric="${key}"` : ""}>${value}</div>
        </div>
        <div class="metric-side">
          ${pill(source)}
          <div class="delta ${down ? "down" : ""}" style="margin-top:18px">${down ? "↘" : "↗"} ${delta}</div>
          <div class="small-label metric-compare-label">vs 上一周期</div>
        </div>
      </div>
      ${sparkline(series, key)}
      <div class="small-label">当前时间段趋势</div>
    </div>
  `;
}

function metricKey(label) {
  return {
    总销售额: "gmv",
    商品总额: "gross_sales",
    订单数: "orders",
    客单价: "aov",
    退款额: "refunds",
    新客户: "customers",
    店铺总客户数: "customers",
    新客销售额: "new_customer_revenue",
    回头客销售额: "returning_customer_revenue",
    新客订单: "new_customer_orders",
    回头客订单: "returning_customer_orders",
    复购率: "repeat_rate",
    广告获客成本: "cac",
    新客户: "new_customers",
    回头客: "returning_customers",
    店铺总客户数: "customers",
    人均消费: "avg_customer_value",
    "LTV（生命周期价值）": "avg_customer_value",
    购买频次: "purchase_frequency",
    用券率: "coupon_order_rate",
    Sessions: "sessions",
    Users: "users",
    广告花费: "spend",
    CPC: "cpc",
    CPM: "cpm",
    ROAS: "roas",
    CPA: "cpa",
    CVR: "cvr",
    转化率: "cvr",
    加购率: "add_to_cart_rate",
    结账率: "checkout_rate",
    支付完成率: "payment_completion_rate",
  }[label];
}

function mockMetric(label, value, source = "Google Ads", series = [24, 24, 24, 24, 24, 24]) {
  const key = metricKey(label);
  return `
    <div class="card mock-card" ${key ? `data-series-key="${key}"` : ""}>
      <div class="mock-head"><span>MOCK DATA</span><span>演示数据</span></div>
      <div class="mock-tags"><span class="mock-tag">${source}</span><span class="mock-tag">示例趋势</span></div>
      <div class="metric-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
        <div class="delta" style="float:right;color:var(--orange)">示例</div>
        ${sparkline(series, key)}
        <div class="small-label">当前时间段趋势（示例）</div>
      </div>
    </div>
  `;
}

function sparkline(points, key = "") {
  const series = normalizeSparklineSeries(points);
  const values = series.map((point) => Number(point.value || 0));
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const coords = values.map((p, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * 100;
    const y = 42 - ((p - min) / (max - min || 1)) * 34;
    return [x, y];
  });
  const line = smoothPath(coords);
  const fill = `${line} L100,46 L0,46 Z`;
  return `
    <div class="sparkline-wrap" ${key ? `data-series-key="${key}"` : ""} data-series="${escapeAttr(JSON.stringify(series))}">
      <svg class="sparkline" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#19a186" stop-opacity=".18"/>
            <stop offset="100%" stop-color="#19a186" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path class="fill" d="${fill}"></path>
        <path class="line" d="${line}"></path>
      </svg>
      <div class="sparkline-tooltip"></div>
    </div>
  `;
}

function smoothPath(points) {
  if (points.length < 2) return "";
  const path = [`M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const tension = 0.18;
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
    path.push(
      `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`,
    );
  }

  return path.join(" ");
}

function donutCard(title, rows, colors = ["#00896b", "#19a186", "#6375d6", "#f59e0b"]) {
  const stops = rows.reduce(
    (acc, row, i) => {
      const start = acc.total;
      const end = start + Number(row[1]);
      acc.parts.push(`${colors[i % colors.length]} ${start}% ${end}%`);
      acc.total = end;
      return acc;
    },
    { total: 0, parts: [] },
  );
  return `
    <div class="card pad chart-card">
      <div class="chart-title">${title}</div>
      <div class="donut-wrap">
        <div class="donut" style="background: conic-gradient(${stops.parts.join(", ")})"></div>
        <div class="legend">
          ${rows
            .map(
              ([label, value], i) => `
                <div class="legend-row">
                  <span class="legend-label"><span class="dot" style="background:${colors[i % colors.length]}"></span>${label}</span>
                  <span class="muted">${Number(value).toFixed(2)}%</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function barChartCard(title, rows, color = "var(--green)") {
  const max = Math.max(...rows.map((r) => Number(r[1] || 0)), 0) || 1;
  return `
    <div class="card pad chart-card">
      <div class="chart-title">${title}</div>
      <div class="bar-chart">
        ${rows
          .map(
            ([label, value, display]) => `
              <div class="bar-row">
                <span class="num">${label}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max((Number(value || 0) / max) * 100, Number(value || 0) > 0 ? 2 : 0)}%; background:${color}"></div></div>
                <span class="muted">${display ?? value}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function tableCard(title, headers, rows) {
  return `
    <div class="card pad">
      ${title ? `<div class="table-title">${title}</div>` : ""}
      ${tableMarkup(headers, rows)}
    </div>
  `;
}

function compactTableCard(title, headers, rows) {
  return `
    <div class="card pad">
      ${title ? `<div class="table-title">${title}</div>` : ""}
      ${tableMarkup(headers, rows, { compact: true })}
    </div>
  `;
}

function tableMarkup(headers, rows, options = {}) {
  return `
    <div class="table-wrap ${options.compact ? "compact" : ""}">
      <table>
        <thead><tr>${headers.map((h, i) => `<th class="${i > 0 ? "num" : ""}">${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (row) => `<tr>${row.map((cell, i) => `<td class="${i > 0 ? "num" : ""}">${cell}</td>`).join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function goalBreakdownPanel(title, subtitle, rows) {
  return `
    <div class="card pad breakdown-panel">
      <div class="section-head">
        <div>
          <div class="section-title">${title}</div>
          <div class="section-subtitle">${subtitle}</div>
        </div>
      </div>
      <div class="grid cols-2">
        ${rows
          .map(
            ([label, english, value, accent]) => `
              <div class="card pad breakdown-card">
                <div class="metric-label">${label}</div>
                <div class="muted">${english}</div>
                <div class="metric-value" style="${accent ? `color:${accent}` : ""}">${value}</div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function ensureSimulatorState(goal) {
  if (!goal) return null;

  const rangeKey = state.dashboardDataKey || `${goal.start_date}:${goal.end_date}:${state.range}`;
  const shouldReset =
    !state.simulator || state.simulator.goalId !== goal.id || state.simulator.rangeKey !== rangeKey;

  if (shouldReset) {
    state.simulator = {
      goalId: goal.id,
      rangeKey,
      sessions: Number(goal.monthly_sessions_run_rate || 0),
      cvr: Number(goal.current_cvr || 0),
      aov: Number(goal.current_aov || 0),
    };
  }

  return state.simulator;
}

function computeSimulatorResult(goal) {
  const simulator = ensureSimulatorState(goal);
  const sessions = Number(simulator?.sessions || 0);
  const cvr = Number(simulator?.cvr || 0);
  const aov = Number(simulator?.aov || 0);
  const forecast = sessions * (cvr / 100) * aov;
  const gap = Math.max(Number(goal?.target_gmv || 0) - forecast, 0);
  return { sessions, cvr, aov, forecast, gap };
}

function simulatorSliderConfig(goal, result) {
  const sessionsBase = Math.max(Number(goal.monthly_sessions_run_rate || 0), Number(goal.required_monthly_sessions || 0), 1000);
  const cvrBase = Math.max(Number(goal.current_cvr || 0), 1);
  const aovBase = Math.max(Number(goal.current_aov || 0), 25);

  return {
    sessions: {
      label: "Sessions (月)",
      subtitle: "Monthly Sessions",
      min: 0,
      max: Math.max(Math.ceil(sessionsBase * 2.2), 5000),
      step: 100,
      value: result.sessions,
      display: formatInteger(result.sessions),
    },
    cvr: {
      label: "CVR",
      subtitle: "Conversion Rate",
      min: 0,
      max: Math.max(Math.ceil(cvrBase * 2.5), 8),
      step: 0.01,
      value: result.cvr,
      display: `${formatNumber(result.cvr)}%`,
    },
    aov: {
      label: "AOV",
      subtitle: "Average Order Value",
      min: 0,
      max: Math.max(Math.ceil(aovBase * 2.2), 300),
      step: 1,
      value: result.aov,
      display: formatCurrency(result.aov),
    },
  };
}

function renderGrowthSimulator(goal) {
  const result = computeSimulatorResult(goal);
  const sliders = simulatorSliderConfig(goal, result);
  const rows = [
    ["sessions", sliders.sessions],
    ["cvr", sliders.cvr],
    ["aov", sliders.aov],
  ];
  const target = Math.max(Number(goal.target_gmv || 0), 1);
  const forecastRatio = Math.min((result.forecast / target) * 100, 100);
  const gapRatio = result.gap / target;
  const status =
    gapRatio <= 0.05
      ? { label: "接近达成", color: "", amountColor: "var(--green)" }
      : gapRatio <= 0.2
        ? { label: "仍有差距", color: "orange", amountColor: "var(--orange)" }
        : { label: "严重偏离", color: "red", amountColor: "var(--red)" };

  return `
    <div class="card pad">
      <div class="section-head">
        <div>
          <div class="section-title">增长模拟器</div>
          <div class="section-subtitle">Growth Simulator</div>
        </div>
      </div>
      <div class="simulator">
        <div>
          ${rows
            .map(
              ([key, config]) => {
                const percent = ((Number(config.value) - Number(config.min)) / Math.max(Number(config.max) - Number(config.min), 1)) * 100;
                return `
                <label class="slider-row slider-row-rich" for="sim-${key}">
                  <div class="slider-copy">
                    <div class="slider-label">${config.label}</div>
                    <div class="section-subtitle">${config.subtitle}</div>
                  </div>
                  <input
                    id="sim-${key}"
                    class="sim-range"
                    type="range"
                    min="${config.min}"
                    max="${config.max}"
                    step="${config.step}"
                    value="${config.value}"
                    style="--fill:${Math.max(0, Math.min(percent, 100)).toFixed(2)}%;"
                    data-sim-key="${key}"
                  />
                  <div class="slider-value">${config.display}</div>
                </label>
              `;
              },
            )
            .join("")}
        </div>
        <div class="card pad simulator-result">
          <div class="metric-label">模拟结果</div>
          <div class="section-subtitle">Simulation Result</div>
          <div class="metric-value" style="color:var(--green)">${formatCurrency(result.forecast)}</div>
          <div class="muted">Sessions × CVR × AOV</div>
          <div class="simulator-gap">
            <span>距离目标</span>
            <strong style="color:${status.amountColor}">${formatCurrency(result.gap)}</strong>
          </div>
          <div style="margin-top:12px">${pill(status.label, status.color)}</div>
          <div class="progress" style="margin-top:12px">
            <span style="width:${forecastRatio}%"></span>
          </div>
          <button class="ghost-btn simulator-reset" data-action="reset-simulator" style="margin-top:18px">重置为当前能力</button>
        </div>
      </div>
    </div>
  `;
}

function updateGrowthSimulator(goal) {
  const mount = document.querySelector("[data-growth-simulator]");
  if (!mount || !goal) return;
  mount.innerHTML = renderGrowthSimulator(goal);
}

function northstarPage() {
  return `
    <div class="card hero-goal">
      <div class="metric-head">
        <div>
          <div class="muted">增长目标 Growth Goal</div>
          <div class="goal-title" data-goal-name>2026年9月 GMV百万计划</div>
          <div class="muted" data-goal-period>目标周期 2026-09-01 → 2026-09-30 · 目标 GMV US$1,000,000.00</div>
          <div style="margin-top:12px">${pill("Shopify")} ${pill("GA4")}</div>
        </div>
        <span data-goal-status>${pill("严重偏离 Off Track", "red")}</span>
      </div>
      <div style="margin-top:24px">
        <div class="metric-head muted"><span data-goal-progress-label>当前月度能力 <span data-metric="achievement_rate">25.61%</span> / 目标</span><strong><span data-goal-progress-value><span data-metric="gmv">US$256,140.00</span> / US$1,000,000.00</span></strong></div>
        <div class="progress" style="margin-top:8px"><span data-goal-progress-bar style="width:25.6%"></span></div>
      </div>
    </div>

    <div class="grid cols-5" style="margin:18px 0 28px" data-goal-summary>
      ${[
        ["目标月份", "2026年9月"],
        ["目标 GMV", "US$1,000,000.00"],
        ["当前月度能力", '<span data-metric="gmv">US$256,140.00</span>'],
        ["目标差距", "US$743,860.00"],
        ["近 30 天 GMV", "US$256,153.98"],
      ]
        .map(([a, b], i) => `<div class="card pad"><div class="metric-label">${a}</div><div class="metric-value" style="${i === 3 ? "color:var(--red)" : i === 2 ? "color:var(--green)" : ""}">${b}</div></div>`)
        .join("")}
    </div>

    <div class="grid cols-2">
      <div data-goal-breakdown>${goalBreakdownPanel("目标拆解", "Target Breakdown", [
        ["达标所需日均 GMV", "Required Daily GMV", "US$33,333.00"],
        ["达标所需日均订单数", "Required Daily Orders", "179"],
        ["达标所需月订单数", "Required Monthly Orders", "5,376"],
        ["达标所需 Sessions", "Required Monthly Sessions", "521,942"],
        ["当前 AOV", "Current AOV", "US$186.02"],
        ["当前 CVR", "Current CVR", "1.03%"],
      ])}</div>
      <div data-current-capability>${goalBreakdownPanel("当前能力评估", "Current Capability", [
        ["当前月度 GMV Run Rate", "Monthly GMV Run Rate", "US$256,140.00"],
        ["当前月度订单 Run Rate", "Monthly Orders Run Rate", "1,377"],
        ["当前月度 Sessions Run Rate", "Monthly Sessions Run Rate", "186,780"],
        ["当前 CVR", "Current CVR", "1.03%"],
        ["当前 AOV", "Current AOV", "US$186.02"],
        ["预测月 GMV", "Forecast Month GMV", "US$357,872.00"],
      ])}</div>
    </div>

    <section class="section">
      <div data-growth-simulator>
        ${renderGrowthSimulator({
          monthly_sessions_run_rate: 186780,
          current_cvr: 1.03,
          current_aov: 186.02,
          target_gmv: 1000000,
        })}
      </div>
    </section>

    <div data-northstar-revenue>${section("Revenue · 收入驱动", "销售额、订单与客单价", pill("Shopify"), `<div class="grid cols-4">
      ${metricCard("总销售额", "US$256,153.98", "-43.64%")}
      ${metricCard("订单数", "1,377", "-23.24%")}
      ${metricCard("客单价", "US$186.02", "-26.57%")}
      ${metricCard("商品总额", "US$296,429.28", "-72.68%")}
      ${metricCard("退款额", "US$978.96", "+63.11%", "Shopify", spikySeries)}
    </div>`)}</div>

    <div data-northstar-traffic>${section("Traffic · 流量效率", "获客质量与广告投放效率", `${pill("GA4")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`, `<div class="grid cols-4">
      ${metricCard("Sessions", "186,765", "-19.10%", "GA4")}
      ${mockMetric("广告花费", "US$49,197.00")}
      ${mockMetric("CPC", "1.00")}
      ${mockMetric("CPM", "7.00")}
    </div>`)}</div>

    <div data-northstar-conversion>${section("Conversion · 转化效率", "站点转化与支付完成", `${pill("Shopify")} ${pill("GA4")}`, `<div class="grid cols-4">
      ${metricCard("CVR", "1.03%", "-15.57%", "Shopify")}
      ${metricCard("加购率", "9.90%", "-22.45%", "GA4")}
      ${metricCard("结账率", "4.50%", "-32.62%", "GA4")}
      ${metricCard("支付完成率", "15.30%", "+32.18%", "GA4")}
    </div>`)}</div>

    <div data-northstar-customer>${section("Customer · 客户质量", "复购、LTV 与客户增长", pill("Shopify"), `<div class="grid cols-4">
      ${metricCard("新客销售额", "US$247,427.04", "-22.41%")}
      ${metricCard("回头客销售额", "US$8,726.94", "-93.56%")}
      ${metricCard("新客订单", "1,304", "-24.93%")}
      ${metricCard("回头客订单", "73", "+28.07%")}
      ${metricCard("复购率", "5.30%", "+66.85%")}
    </div>`)}</div>
  `;
}

function personasPage() {
  const activeSource = state.sourceTab;
  if (activeSource === "Shopify") return personasShopifyPage();
  if (activeSource !== "总览") return personasSourcePage(activeSource);

  return `
    <p class="intro">跨渠道人群画像分析：综合 GA4、Google Ads、Meta Ads 与 Shopify 客户数据，识别核心人群与价值分层。</p>
    ${sourceTabs(activeSource)}
    <div class="sync-bar">Last Sync Time: <strong>${state.dashboardData?.sync?.last_synced_at ? formatDateTime(state.dashboardData.sync.last_synced_at) : "等待同步"}</strong></div>
    <div data-persona-overview>${personaEmptyState("正在加载用户画像数据…")}</div>
  `;
}

function personasSourcePage(source) {
  const sourceKey = source === "GA4" ? "ga4" : source === "Google Ads" ? "google_ads" : "meta_ads";
  return `
    <p class="intro">${source} 受众维度：Gender、Age、Interests、Language、Country/City、Device。</p>
    ${sourceTabs(source)}
    <div class="sync-bar">Last Sync Time: <strong>${state.dashboardData?.sync?.last_synced_at ? formatDateTime(state.dashboardData.sync.last_synced_at) : "等待同步"}</strong></div>
    <div data-persona-source="${sourceKey}">${personaEmptyState(source === "GA4" ? "正在加载 GA4 画像数据…" : `等待 ${source} 真实受众数据同步`)}</div>
  `;
}

function personasShopifyPage() {
  return `
    <p class="intro">跨渠道人群画像分析：综合 GA4、Google Ads、Meta Ads 与 Shopify 客户数据，识别核心人群与价值分层。</p>
    ${sourceTabs("Shopify")}
    <div class="sync-bar">Last Sync Time: <strong>${state.dashboardData?.sync?.last_synced_at ? formatDateTime(state.dashboardData.sync.last_synced_at) : "等待同步"}</strong></div>
    <div data-persona-shopify>${personaEmptyState("正在加载 Shopify 客户画像…")}</div>
  `;
}

function personaEmptyState(message, hint = "") {
  return `<div class="card pad mock-empty"><div class="mock-head"><span>等待受众数据</span><span>GA4 / Ads</span></div><div class="muted" style="margin-top:12px">${message}</div>${hint ? `<div class="muted" style="margin-top:8px;color:#9a6b00">${hint}</div>` : ""}</div>`;
}

function renderPersonaOverviewSections(audience, shopifyPersona, sync) {
  return `
    ${section("人群属性", "综合各渠道汇总的人群性别与年龄结构", `${pill("GA4")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")} ${pill("Shopify")}`, `
      <div class="grid cols-2">
        ${renderAudienceDonut("性别分布", audience.gender, undefined, getAudienceMissingHint("gender", sync))}
        ${renderAudienceBar("年龄分布", audience.age, getAudienceMissingHint("age", sync))}
      </div>
    `)}
    ${section("核心画像结论", "基于当前时间范围内的受众结构自动生成", "", renderPersonaInsights(audience, shopifyPersona))}
    ${section("地区与设备", "跨渠道地区与设备分布", "", `
      <div class="grid cols-2">
        ${renderAudienceTable("地区分布", "地区分布", audience.country)}
        ${renderAudienceTable("城市分布", "地区分布", audience.city)}
      </div>
      <div class="grid cols-2">
        ${renderAudienceDonut("访问设备明细", audience.device, ["#00896b", "#19a186", "#64c3a8", "#8e98aa"])}
        ${renderAudienceDonut("语言分布", audience.language, ["#00896b", "#19a186", "#6375d6", "#f59e0b", "#8e98aa"])}
      </div>
    `)}
    ${section("兴趣标签", "", "", renderInterestTable(audience.interest))}
    ${section("客户价值画像", "", "", renderShopifyValueTable(shopifyPersona.value_segments || []))}
  `;
}

function renderPersonaSourceSections(source, snapshot, sync) {
  if (!snapshot || !hasAudienceData(snapshot)) {
    return `${section(`${source} ${source === "GA4" ? pill("GA4") : pill(source, "red")}`, "当前还没有可用的真实受众快照", "", personaEmptyState("先在集成设置里完成连接并手动同步，受众数据进 Supabase 后这里会自动替换。"))}`;
  }

  return `
    ${section(`${source} ${source === "GA4" ? pill("GA4") : pill(source, "red")}`, `最新快照日期：${snapshot.latest_day || "—"}`, "", `
      <div class="grid cols-2">
        ${renderAudienceDonut("性别分布", snapshot.gender, undefined, getAudienceMissingHint("gender", sync))}
        ${renderAudienceBar("年龄分布", snapshot.age, getAudienceMissingHint("age", sync))}
      </div>
    `)}
    ${section("核心画像结论", "", "", renderPersonaInsights(snapshot))}
    ${section("兴趣标签", "", "", renderInterestTable(snapshot.interest))}
    <div class="grid cols-2">
      ${renderAudienceDonut("Language", snapshot.language, ["#00896b", "#19a186", "#6375d6", "#f59e0b", "#8e98aa"])}
      ${renderAudienceDonut("访问设备明细", snapshot.device, ["#00896b", "#19a186", "#64c3a8", "#8e98aa"])}
    </div>
    <div class="grid cols-2">
      ${renderAudienceTable("国家分布", "地区分布", snapshot.country)}
      ${renderAudienceTable("City", "地区分布", snapshot.city)}
    </div>
  `;
}

function renderShopifyPersonaSections(persona) {
  return `
    ${section("Shopify", "Shopify 客户画像：Country/State/City、New vs Returning、AOV、LTV、Repeat Purchase Rate、Order Count", pill("Shopify"), `
      <div class="grid cols-3">
        ${renderAudienceTable("国家分布", "地区分布", persona.country)}
        ${renderAudienceTable("州/省分布", "地区分布", persona.province)}
        ${renderAudienceTable("City", "地区分布", persona.city)}
      </div>
    `)}
    ${section("New vs Returning", "", "", `
      <div class="grid cols-2">
        ${renderAudienceDonut("New vs Returning", persona.new_vs_returning)}
        <div class="grid cols-2">
          ${metricCard("客单价", formatCurrency(persona.metrics?.aov), "+0.00%", "Shopify", metricSeries)}
          ${metricCard("LTV（生命周期价值）", formatCurrency(persona.metrics?.ltv), "+0.00%", "Shopify", trendSeries)}
          ${metricCard("复购率", `${formatNumber(persona.metrics?.repeat_rate)}%`, "+0.00%", "Shopify", spikySeries)}
          ${metricCard("订单数", formatInteger(persona.metrics?.orders), "+0.00%", "Shopify", metricSeries)}
        </div>
      </div>
    `)}
    ${section("客户价值画像", "", "", renderShopifyValueTable(persona.value_segments || []))}
  `;
}

function renderOperationsDashboard(data, cardDelta) {
  const summary = data.summary || {};
  const ga4 = data.ga4_funnel || {};
  const previous = data.previous || {};
  const previousSummary = previous.summary || {};
  const previousGa4 = previous.ga4_funnel || {};
  const daily = data.daily_sales || [];
  const orderMix = data.order_mix || [
    { name: "普通", orders: summary.orders || 0, percentage: 100 },
    { name: "B2B", orders: 0, percentage: 0 },
  ];
  const deviceRows = (data.audience?.sources?.ga4?.device || data.audience?.overview?.device || []).map((row) => [
    row.name,
    Number(row.percentage || 0),
  ]);
  const topCustomerRows = (data.top_customers || []).map((row) => [
    escapeHtml(row.name),
    maskEmail(row.email),
    formatCurrency(row.revenue),
    formatInteger(row.orders),
    row.last_order_at ? formatDateTime(row.last_order_at) : "—",
  ]);
  const ga4Channels = data.audience?.sources?.ga4?.channel || data.audience?.overview?.channel || [];
  const channelVisitors = ga4Channels.slice(0, 6).map((row) => [row.name, Number(row.users || 0), formatInteger(row.users)]);
  const channelConversionRows = buildOperationsChannelConversion(data.channel_sales || [], ga4Channels);
  const provinceRows = data.province_sales || [];

  const checkoutAttempts = Number(ga4.checkouts || 0);
  const purchases = Number(ga4.purchases || summary.orders || 0);
  const abandonedCheckouts = Math.max(checkoutAttempts - purchases, 0);
  const abandonedAmount = abandonedCheckouts * Number(summary.aov || 0);
  const completionRate = Number(ga4.payment_completion_rate || 0);

  const previousCheckoutAttempts = Number(previousGa4.checkouts || 0);
  const previousPurchases = Number(previousGa4.purchases || previousSummary.orders || 0);
  const previousAbandonedCheckouts = Math.max(previousCheckoutAttempts - previousPurchases, 0);
  const previousAbandonedAmount = previousAbandonedCheckouts * Number(previousSummary.aov || 0);
  const previousCompletionRate = Number(previousGa4.payment_completion_rate || 0);

  const days = inclusiveDaysFromRange(data.range);
  const avgOrdersPerDay = days ? Number(summary.orders || 0) / days : 0;

  return `
    <div class="grid cols-5">
      ${metricCard("总销售额", formatCurrency(summary.gmv), cardDelta.gmv, "Shopify", metricSeries)}
      ${metricCard("商品总额", formatCurrency(summary.gross_sales), cardDelta.gross_sales, "Shopify", trendSeries)}
      ${metricCard("订单数", formatInteger(summary.orders), cardDelta.orders, "Shopify", metricSeries)}
      ${metricCard("客单价", formatCurrency(summary.aov), cardDelta.aov, "Shopify", metricSeries)}
      ${metricCard("退款额", formatCurrency(summary.refunds), cardDelta.refunds, "Shopify", spikySeries)}
    </div>
    ${section("弃购分析", "", "", `<div class="grid cols-4">
      ${simpleMetric("结账次数", formatInteger(checkoutAttempts), compareDelta(checkoutAttempts, previousCheckoutAttempts))}
      ${simpleMetric("弃购次数", formatInteger(abandonedCheckouts), compareDelta(abandonedCheckouts, previousAbandonedCheckouts))}
      ${simpleMetric("弃购金额", formatCurrency(abandonedAmount), compareDelta(abandonedAmount, previousAbandonedAmount))}
      ${simpleMetric("结账完成率", `${formatNumber(completionRate)}%`, compareDelta(completionRate, previousCompletionRate))}
    </div>`)}
    ${section("日均单量", "根据当前时间范围内日均订单自动计算", "", `<div class="grid cols-3">
      <div class="card pad"><div class="metric-label">日均订单量</div><div class="metric-value">${formatNumber(avgOrdersPerDay)}</div><div class="small-label">单/天</div></div>
      <div class="card pad"><div class="metric-label">区间总订单</div><div class="metric-value">${formatInteger(summary.orders)}</div><div class="small-label">订单</div></div>
      <div class="card pad"><div class="metric-label">统计天数</div><div class="metric-value">${formatInteger(days)}</div><div class="small-label">天</div></div>
    </div>`)}
    <div class="grid cols-2">
      ${donutCard("订单类型", orderMix.map((row) => [row.name, row.percentage]), ["#00896b", "#6375d6"])}
      ${couponUsageSummaryCard(data.coupon_usage || [], summary.orders || 0)}
      ${funnelProgressCard(
        "结账转化漏斗",
        [
          ["发起结账", checkoutAttempts, 100],
          ["完成结账", purchases, checkoutAttempts ? (purchases / checkoutAttempts) * 100 : 0],
          ["弃购", abandonedCheckouts, checkoutAttempts ? (abandonedCheckouts / checkoutAttempts) * 100 : 0],
        ],
        pill("Shopify"),
      )}
      ${deviceRows.length ? progressDistributionCard("访问设备明细", deviceRows.map(([label, value]) => [label, value, value]), formatInteger, pill("GA4")) : personaEmptyState("访问设备明细暂无真实数据")}
    </div>
    ${section("高价值客户", "按当前时间范围内客户销售额排序", "", topCustomerRows.length ? tableCard("", ["客户", "邮箱", "销售额", "件数", "最近下单"], topCustomerRows) : personaEmptyState("当前时间范围内暂无高价值客户数据"))}
    ${section("销售趋势", "", "", dualLineChartCard("GMV vs 商品总额", daily.map((row) => ({ label: row.day, value: row.gmv })), daily.map((row) => ({ label: row.day, value: row.gross_sales })), "销售额", "商品总额"))}
    <div class="grid cols-2">
      ${channelVisitors.length ? barChartCard("访客渠道来源", channelVisitors, "var(--green)") : personaEmptyState("GA4 暂无渠道访客数据")}
      ${channelConversionRows.length
        ? barChartCard("渠道转化率", channelConversionRows.map((row) => [row[0], row[1], `${formatNumber(row[1])}%`]), "#6375d6")
        : personaEmptyState("缺少可计算的渠道转化率", "需要同时有 GA4 渠道访客和 Shopify 渠道订单。")}
    </div>
    ${section("商品销量排行", "", "", tableCard("", ["#", "商品", "销量", "销售额"], (data.top_products || []).map((row, index) => [index + 1, escapeHtml(row.title), formatInteger(row.units_sold), formatCurrency(row.revenue)])))}
    ${section("州/省销售分布", "按 Shopify 订单地址聚合", "", provinceRows.length ? stateRevenueBoard(provinceRows) : personaEmptyState("当前时间范围内暂无州/省销售分布"))}
  `;
}

function simpleMetric(label, value, delta) {
  const down = String(delta).includes("-");
  return `<div class="card pad"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="delta ${down ? "down" : ""}">${down ? "↘" : "↗"} ${delta}</div></div>`;
}

function dualLineChartCard(title, primarySeries, secondarySeries, primaryLabel, secondaryLabel) {
  const points = primarySeries.map((row, index) => ({
    label: row.label,
    primary: Number(row.value || 0),
    secondary: Number(secondarySeries[index]?.value || 0),
  }));
  if (!points.length) return personaEmptyState(`${title} 暂无真实数据`);

  const values = points.flatMap((row) => [row.primary, row.secondary]);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const toCoords = (key) =>
    points.map((row, index) => [
      (index / Math.max(points.length - 1, 1)) * 100,
      56 - ((Number(row[key]) - min) / (max - min || 1)) * 44,
    ]);

  return `
    <div class="card pad chart-card line-chart-card">
      <div class="chart-title">${title}</div>
      <div class="line-legend">
        <span><i style="background:#00896b"></i>${primaryLabel}</span>
        <span><i style="background:#6375d6"></i>${secondaryLabel}</span>
      </div>
      <svg class="line-chart" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <path class="line-grid" d="M0,14 H100 M0,30 H100 M0,46 H100"></path>
        <path class="line-primary" d="${smoothPath(toCoords("primary"))}"></path>
        <path class="line-secondary" d="${smoothPath(toCoords("secondary"))}"></path>
      </svg>
    </div>
  `;
}

function inclusiveDaysFromRange(range) {
  if (!range?.start || !range?.end) return 0;
  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
}

function prettyChannel(value) {
  const text = String(value || "unknown").trim();
  if (!text) return "Unknown";
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function maskEmail(value) {
  const text = String(value || "").trim();
  if (!text || !text.includes("@")) return "—";
  const [name, domain] = text.split("@");
  if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function couponUsageSummaryCard(rows, totalOrders) {
  const safeRows = (rows || []).slice(0, 4);
  if (!safeRows.length) return personaEmptyState("优惠券使用暂无真实数据");

  const total = totalOrders || safeRows.reduce((sum, row) => sum + Number(row.orders || 0), 0) || 1;
  const colors = ["#d7dde7", "#7a55dc", "#00896b", "#6375d6"];
  let cursor = 0;
  const segments = safeRows
    .map((row, index) => {
      const share = (Number(row.orders || 0) / total) * 100;
      const segment = `${colors[index % colors.length]} ${cursor}% ${cursor + share}%`;
      cursor += share;
      return segment;
    })
    .join(", ");

  return `
    <div class="card pad chart-card">
      <div class="chart-head-inline">
        <div class="chart-title">优惠券使用</div>
        <span class="small-badge">用券率 ${formatNumber(totalOrders ? safeRows.reduce((sum, row) => sum + Number(row.orders || 0), 0) / totalOrders * 100 : 0)}%</span>
      </div>
      <div class="stack-progress" style="background:linear-gradient(90deg, ${segments})"></div>
      <div class="legend compact">
        ${safeRows
          .map(
            (row, index) => `
              <div class="legend-row">
                <span class="legend-label"><span class="dot" style="background:${colors[index % colors.length]}"></span>${escapeHtml(row.category)}</span>
                <span class="muted">${formatInteger(row.orders)} / ${formatNumber(row.order_share)}%</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function funnelProgressCard(title, rows, sourceTag = "") {
  const max = Math.max(...rows.map((row) => Number(row[1] || 0)), 0) || 1;
  return `
    <div class="card pad chart-card">
      <div class="chart-head-inline">
        <div class="chart-title">${title}</div>
        ${sourceTag}
      </div>
      <div class="bar-chart progress-chart">
        ${rows
          .map(
            ([label, value, ratio]) => `
              <div class="progress-row">
                <div class="progress-meta">
                  <strong>${label}</strong>
                  <span>${formatNumber(ratio)}%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max((Number(value || 0) / max) * 100, Number(value || 0) > 0 ? 2 : 0)}%"></div></div>
                <b class="muted">${formatInteger(value)}</b>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function progressDistributionCard(title, rows, valueFormatter = formatInteger, sourceTag = "") {
  const max = Math.max(...rows.map((row) => Number(row[2] || row[1] || 0)), 0) || 1;
  return `
    <div class="card pad chart-card">
      <div class="chart-head-inline">
        <div class="chart-title">${title}</div>
        ${sourceTag}
      </div>
      <div class="bar-chart progress-chart">
        ${rows
          .map(
            ([label, ratio, absolute]) => `
              <div class="progress-row">
                <div class="progress-meta">
                  <strong>${label}</strong>
                  <span>${formatNumber(ratio)}%</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.max((Number(absolute || 0) / max) * 100, Number(absolute || 0) > 0 ? 2 : 0)}%"></div></div>
                <b class="muted">${valueFormatter(absolute)}</b>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function stateRevenueBoard(rows) {
  const safeRows = rows.slice(0, 12);
  const max = Math.max(...safeRows.map((row) => Number(row.revenue || 0)), 0) || 1;
  return `
    <div class="card pad map-panel">
      <div class="state-grid">
        ${safeRows
          .map((row) => {
            const intensity = Math.max(Number(row.revenue || 0) / max, 0.18);
            return `
              <div class="state-tile" style="--tile-alpha:${intensity}">
                <strong>${escapeHtml(row.province)}</strong>
                <span>${formatCurrency(row.revenue)}</span>
                <small>${formatInteger(row.orders)} 单</small>
              </div>
            `;
          })
          .join("")}
      </div>
      <div>${miniRanks(rows)}</div>
    </div>
  `;
}

function buildOperationsChannelConversion(channelSales, ga4Channels) {
  const ga4Map = new Map();
  (ga4Channels || []).forEach((row) => {
    ga4Map.set(normalizeChannelGroup(row.name), Number(row.users || 0));
  });

  return (channelSales || [])
    .map((row) => {
      const label = normalizeChannelGroup(row.channel);
      const sessions = ga4Map.get(label) || 0;
      return {
        label,
        sessions,
        cvr: sessions ? (Number(row.orders || 0) / sessions) * 100 : 0,
      };
    })
    .filter((row) => row.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6)
    .map((row) => [row.label, row.cvr]);
}

function normalizeChannelGroup(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "Other";
  if (text.includes("paid social") || text.includes("facebook") || text.includes("instagram") || text.includes("meta") || text.includes("tiktok")) {
    return "Paid Social";
  }
  if (text.includes("paid search") || text.includes("google ads") || text.includes("bing ads") || text.includes("cpc")) {
    return "Paid Search";
  }
  if (text.includes("organic social")) {
    return "Organic Social";
  }
  if (text.includes("organic search") || text === "google" || text.includes("seo")) {
    return "Organic Search";
  }
  if (text.includes("email")) {
    return "Email";
  }
  if (text.includes("direct") || text.includes("unknown") || text.includes("none")) {
    return "Direct";
  }
  return prettyChannel(value);
}

function renderAudienceDonut(title, rows, colors, hint = "") {
  if (!rows?.length) return personaEmptyState(`${title} 暂无真实数据`, hint);
  return donutCard(title, rows.slice(0, 8).map((row) => [row.name, Number(row.percentage || row.value || 0)]), colors);
}

function renderAudienceBar(title, rows, hint = "") {
  if (!rows?.length) return personaEmptyState(`${title} 暂无真实数据`, hint);
  return barChartCard(title, rows.slice(0, 8).map((row) => [row.name, Number(row.users || row.value || 0)]));
}

function renderAudienceTable(title, label, rows) {
  if (!rows?.length) return personaEmptyState(`${title} 暂无真实数据`);
  return compactTableCard(title, [label, "Users", "占比"], rows.slice(0, 12).map((row) => [escapeHtml(row.name), formatInteger(row.users), `${formatNumber(row.percentage)}%`]));
}

function renderInterestTable(rows) {
  if (!rows?.length) return personaEmptyState("兴趣标签暂无真实数据");
  return compactTableCard("兴趣标签", ["兴趣类别", "Affinity", "占比"], rows.slice(0, 12).map((row) => [escapeHtml(row.name), formatNumber(row.affinity || row.users), `${formatNumber(row.percentage)}%`]));
}

function renderShopifyValueTable(rows) {
  if (!rows?.length) return personaEmptyState("客户价值画像暂无真实数据");
  const totalCustomers = rows.reduce((sum, row) => sum + Number(row.customers || 0), 0) || 1;
  return compactTableCard("客户价值画像", ["价值分层", "客户数", "销售额", "客单价", "占比"], rows.map((row) => [escapeHtml(row.name || row.segment), formatInteger(row.customers), formatCurrency(row.revenue), formatCurrency(row.aov), `${formatNumber((Number(row.customers || 0) / totalCustomers) * 100)}%`]));
}

function hasAudienceData(snapshot) {
  return ["gender", "age", "interest", "language", "country", "city", "device", "channel"].some((key) => Array.isArray(snapshot?.[key]) && snapshot[key].length);
}

function getAudienceMissingHint(segmentType, sync) {
  const skipped = sync?.ga4?.skipped_segments || [];
  const matched = skipped.find((item) => item.segment_type === segmentType);
  if (!matched) return "";
  if (segmentType === "gender" || segmentType === "age") {
    return "GA4 当前未返回该人口属性维度。请检查 Google Signals、人口统计设置，或等待数据量达到展示阈值。";
  }
  return `GA4 同步时跳过了 ${segmentType} 维度。`;
}

function renderPersonaInsights(snapshot, shopifyPersona = null) {
  const insights = [];
  const topGender = snapshot?.gender?.[0];
  const topAge = snapshot?.age?.[0];
  const topCountry = snapshot?.country?.[0];
  const topCity = snapshot?.city?.[0];
  const topDevice = snapshot?.device?.[0];
  const topInterest = snapshot?.interest?.[0];
  const topLanguage = snapshot?.language?.[0];
  const repeatRate = shopifyPersona?.metrics?.repeat_rate;
  const aov = shopifyPersona?.metrics?.aov;

  if (topGender) insights.push(`性别上以 ${topGender.name} 为主，占比 ${formatNumber(topGender.percentage)}%。`);
  if (topAge) insights.push(`年龄段集中在 ${topAge.name}，是当前最核心的人群层。`);
  if (topCountry) insights.push(`地区上 ${topCountry.name} 占比最高，用户占比 ${formatNumber(topCountry.percentage)}%。`);
  if (topCity) insights.push(`城市层面 ${topCity.name} 当前最活跃。`);
  if (topDevice) insights.push(`设备偏好以 ${topDevice.name} 为主，占比 ${formatNumber(topDevice.percentage)}%。`);
  if (topLanguage) insights.push(`语言分布中 ${topLanguage.name} 当前占优。`);
  if (topInterest) insights.push(`兴趣标签里 ${topInterest.name} 最突出，可用于后续广告素材和受众包。`);
  if (repeatRate !== undefined && repeatRate !== null) insights.push(`Shopify 客户复购率目前为 ${formatNumber(repeatRate)}%，可以结合价值分层继续做精细化运营。`);
  if (aov !== undefined && aov !== null) insights.push(`当前客单价约为 ${formatCurrency(aov)}，建议结合核心年龄与地区做定向投放。`);

  if (!insights.length) return personaEmptyState("当前时间范围内还没有足够的人群画像特征可供分析");

  return `
    <div class="insight-list">
      ${insights.slice(0, 6).map((text) => `<div class="insight-item">${escapeHtml(text)}</div>`).join("")}
    </div>
  `;
}

function operationsPage() {
  return `<div data-operations-content>${personaEmptyState("正在加载运营数据看板…")}</div>`;
}

function marketingPage() {
  return `
    <div data-marketing-overview>${section("营销概览", "", pill("演示数据", "orange"), `<div class="grid cols-5">
      ${mockMetric("广告花费", "US$244,001.00")}
      ${mockMetric("销售额", "US$29,667.00")}
      ${mockMetric("ROAS", "0.00")}
      ${mockMetric("CPA", "802.00")}
      ${mockMetric("订单数", "310")}
    </div>`)}</div>
    <div data-marketing-channel-table>${section("渠道表现", "", pill("演示数据", "orange"), tableCard("", ["渠道", "花费", "销售额", "订单数", "客户数", "ROAS", "CPA", "CVR"], [
      ["Meta Ads", "US$79,584.00", "US$3,550.00", "36", "32", "0.04x", "US$2,210.67", "2.29%"],
      ["Google Ads", "US$61,727.00", "US$3,280.00", "38", "34", "0.05x", "US$1,624.39", "2.07%"],
      ["Organic", "US$8,213.00", "US$5,286.00", "56", "50", "0.64x", "US$146.66", "4.94%"],
      ["其他", "US$0.00", "US$7,987.04", "44", "43", "0.00x", "US$0.00", "0.00%"],
    ]))}</div>
    <div data-marketing-funnel>${section("营销漏斗", "Shopify + GA4", `${pill("Shopify")} ${pill("GA4", "red")}`, `<div class="card pad">
      ${[
        ["曝光", "100.00%", "23,208,133"],
        ["点击", "1.97%", "457,216"],
        ["访问 Sessions", "1.53%", "356,098"],
        ["加购", "0.22%", "51,756"],
        ["结账", "0.00%", "0"],
        ["购买", "0.01%", "1,377"],
      ].map(([a,b,c]) => `<div class="funnel-row"><b>${a}</b><div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(parseFloat(b), 1)}%"></div></div><b class="num">${c}</b></div>`).join("")}
    </div>`)}</div>
    <div data-marketing-acquisition>${section("获客分析", "新客/回头客及广告获客成本", `${pill("Shopify")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`, `<div class="grid cols-5">
      ${metricCard("新客户", "1,304", "-24.93%")}
      ${metricCard("回头客", "73", "+28.07%")}
      ${mockMetric("广告获客成本", "US$0.00")}
      ${metricCard("新客销售额", "US$247,427.04", "-22.42%")}
      ${metricCard("回头客销售额", "US$8,726.94", "-93.56%")}
    </div>`)}</div>
    ${section("地域表现", "", `${pill("Shopify")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`, `<div class="grid cols-2">
      ${barChartCard("国家销售额", countryRows.map((r) => [r[0], Number(r[2].replace(/[^0-9.]/g, ""))]))}
      ${mockMetric("区域 ROAS", "0.00")}
    </div>${tableCard("", ["地区", "销售额", "ROAS", "区域 CPA"], countryRows.map((r) => [r[0], r[2], "0.00x", "US$0.00"]))}`)}
  `;
}

function customersPage() {
  return `
    <div data-customers-overview>${section("用户概览", "店铺总客户数，为运营分群、复购指标分析提供基础", pill("Shopify"), `<div class="grid cols-5">
      ${metricCard("店铺总客户数", "65,580", "+0.00%")}
      ${metricCard("新客户", "1,302", "-25.04%")}
      ${metricCard("回头客", "70", "+27.27%", "Shopify", spikySeries)}
      ${metricCard("复购率", "5.30%", "+66.85%")}
      ${metricCard("新客销售额", "US$247,427.04", "-22.41%")}
    </div>`)}</div>
    <div data-customer-demographics>${section("用户画像分析", "结合 GA4 与 Shopify 的核心用户特征", `${pill("GA4")} ${pill("Shopify")}`, personaEmptyState("正在加载用户画像分析…"))}</div>
    <div class="grid cols-2">
      <div data-customer-segments>${tableCard("用户分群", ["分类", "客户数", "销售额", "占比"], [
        ["单次购买", "1,348", "US$252,365.26", "98.97%"],
        ["新客户", "1,302", "US$248,941.71", "95.59%"],
        ["用券客户", "1,086", "US$209,449.55", "79.74%"],
        ["联盟客户", "417", "US$79,240.18", "30.62%"],
        ["高价值客户", "396", "US$92,779.76", "29.07%"],
        ["复购客户", "70", "US$10,323.77", "5.14%"],
      ])}</div>
      <div data-customer-segment-distribution>${donutCard("客户分类分布", [["未用券客户", 20.26], ["新人券客户", 2.35], ["站内活动券客户", 42.88], ["达人券客户", 34.51]], ["#667085", "#f59e0b", "#00896b", "#3166d6"])}</div>
    </div>
    ${section("地域分布", "", pill("Shopify"), `<div class="grid cols-2">
      ${barChartCard("区域销售额", countryRows.map((r) => [r[0], Number(r[2].replace(/[^0-9.]/g, ""))]))}
      ${barChartCard("区域客单价", countryRows.map((r) => [r[0], Number(r[3].replace(/[^0-9.]/g, ""))]), "#6375d6")}
    </div><div data-country-sales>${tableCard("国家分布", ["地区", "客户数", "销售额", "客单价", "占比"], countryRows)}</div>`)}
    <div data-customers-acquisition-quality>${section("获客质量", "", pill("Shopify"), `<div class="grid cols-3">
      ${metricCard("联盟客户占比", "30.60%", "-31.68%")}
      ${barChartCard("渠道客户数", [["Google", 461], ["直接访问", 428], ["Facebook", 253], ["Instagram", 154], ["其他", 43], ["Organic Search", 23]])}
      ${barChartCard("渠道复购率", [["Google", 6.61], ["直接访问", 6.0], ["Facebook", 2.36], ["Instagram", 3.9], ["其他", 6.82], ["Organic Search", 4.35]], "#45bd9d")}
    </div>`)}</div>
    <div data-customers-value>${section("用户价值", "人均消费、购买频次、LTV 与二次购买间隔", pill("Shopify"), `<div class="grid cols-4">
      ${metricCard("人均消费", "US$188.07", "-26.22%")}
      ${metricCard("LTV（生命周期价值）", "US$76.58", "+0.00%")}
      ${metricCard("购买频次", "1.01", "+0.48%")}
      ${metricCard("回头客", "70", "+27.27%")}
    </div>${tableCard("高价值客户 Top", ["客户", "邮箱", "订单数", "销售额", "LTV", "最近下单"], customerValueRows)}`)}</div>
  `;
}

function aarrrPage() {
  return `
    <div data-aarrr-acquisition>${stage("A", "Acquisition", "获取 · 流量与广告投放", `
      <div class="grid cols-3">
        ${mockMetric("Sessions", "11,780", "GA4")}
        ${mockMetric("Users", "8,866", "GA4")}
        ${mockMetric("广告花费", "US$47,554.00")}
        ${mockMetric("CPC", "1.00")}
        ${mockMetric("CPM", "8.00")}
      </div>
      <div class="grid cols-2" style="margin-top:18px">
        ${donutCard("渠道来源占比", [["Google", 23.02], ["邮件营销", 21.84], ["TikTok", 19.68], ["Instagram", 15.28], ["Facebook", 14.58], ["直播访问", 5.60]], ["#00896b", "#49b994", "#6375d6", "#8999ea", "#f59e0b", "#a0aec0"])}
        ${barChartCard("渠道访问趋势", [["5月11日", 32000], ["5月18日", 32200], ["5月25日", 32100], ["6月1日", 32300], ["6月10日", 32150]])}
      </div>
    `)}</div>
    <div data-aarrr-activation>${stage("A", "Activation", "激活 · 站内转化与落地页", `
      <div class="grid cols-3">
        ${mockMetric("加购率", "6.20%")}
        ${mockMetric("结账率", "2.50%")}
        ${mockMetric("转化率", "0.80%")}
      </div>
      ${tableCard("落地页表现", ["#", "页面", "路径", "访问量", "占比"], [
        ["1", "c16 cold press juicer", "/products/c16-cold-press-juicer", "45,759", "24.19%"],
        ["2", "首页", "/", "15,227", "8.05%"],
        ["3", "c16 cold press juicer", "/web-pixels/products/c16", "14,932", "7.89%"],
        ["4", "c16 cold press juicer", "/sandbox/products/c16", "11,453", "6.05%"],
        ["5", "c16 cold press juicer", "/modern/products/c16", "9,574", "5.06%"],
      ])}
    `)}</div>
    <div data-aarrr-revenue>${stage("R", "Revenue", "收入 · 销售与优惠券", `<div class="grid cols-4">
      ${metricCard("商品总额", "US$296,429.28", "-72.68%")}
      ${metricCard("总销售额", "US$256,153.98", "-43.64%")}
      ${metricCard("订单数", "1,377", "-23.24%")}
      ${metricCard("客单价", "US$186.02", "-26.57%")}
      ${metricCard("退款额", "US$978.96", "+63.11%", "Shopify", spikySeries)}
      ${metricCard("用券率", "79.50%", "-2.37%")}
    </div><div data-coupon-usage-breakdown>${tableCard("优惠券类型分布", ["分类", "订单数", "销售额", "占比"], [
      ["未用券", "283", "US$47,023.41", "20.55%"],
      ["新人券", "32", "US$5,609.62", "2.32%"],
      ["活动券", "588", "US$114,514.59", "42.70%"],
      ["达人券", "474", "US$89,006.36", "34.42%"],
    ])}</div>`)}</div>
    <div data-aarrr-retention>${stage("R", "Retention", "留存 · 新老客与复购", `<div class="grid cols-5">
      ${metricCard("新客订单", "1,304", "-24.93%")}
      ${metricCard("回头客订单", "73", "+28.07%", "Shopify", spikySeries)}
      ${metricCard("新客销售额", "US$247,427.04", "-22.43%")}
      ${metricCard("回头客销售额", "US$8,726.94", "-93.56%", "Shopify", spikySeries)}
      ${metricCard("复购率", "5.30%", "+66.67%")}
    </div>`)}</div>
    <div data-aarrr-referral>${stage("R", "Referral", "推荐 · 联盟与达人导购", `
      <div class="grid cols-3">
        ${metricCard("联盟订单", "0", "0.00%", "Shopify", [0, 0, 0, 0, 0, 0])}
        ${metricCard("联盟销售额", formatCurrency(0), "0.00%", "Shopify", [0, 0, 0, 0, 0, 0])}
        ${metricCard("联盟订单占比", "0.00%", "0.00%", "Shopify", [0, 0, 0, 0, 0, 0])}
        ${metricCard("达人券订单", "0", "0.00%", "Shopify", [0, 0, 0, 0, 0, 0])}
        ${metricCard("达人券销售额", formatCurrency(0), "0.00%", "Shopify", [0, 0, 0, 0, 0, 0])}
      </div>${tableCard("联盟达人排行", ["#", "联盟/达人", "订单数", "销售额", "订单占比"], [])}`)}</div>
  `;
}

function stage(letter, title, subtitle, inner, badge = pill(title === "Acquisition" || title === "Activation" ? "演示数据" : "Shopify", title === "Acquisition" || title === "Activation" ? "orange" : "")) {
  return `
    <section class="section">
      <div class="section-head">
        <span class="source-icon" style="width:32px;height:32px;border-radius:7px;background:${letter === "A" ? "var(--green)" : letter === "R" ? "#6375d6" : "#f59e0b"};color:#fff;font-weight:850">${letter}</span>
        <div>
          <div class="section-title">${title} ${badge}</div>
          <div class="section-subtitle">${subtitle}</div>
        </div>
      </div>
      ${inner}
    </section>
  `;
}

function goalsPage() {
  const form = state.goalForm || defaultGoalForm(state.goalsData?.active_goal);
  const activeGoal = state.goalsData?.active_goal || null;
  const goalRows = state.goalsData?.goals || [];
  const activeGoalId = activeGoal?.id || "";
  const dashboardGoal = state.dashboardData?.active_goal || null;
  const activeRate =
    dashboardGoal && activeGoalId && dashboardGoal.id === activeGoalId
      ? `${formatNumber(dashboardGoal.achievement_rate)}%`
      : "—";
  const activeActual =
    dashboardGoal && activeGoalId && dashboardGoal.id === activeGoalId
      ? formatCurrency(dashboardGoal.actual_gmv)
      : "—";
  const listRows = goalRows.length
    ? goalRows.map((goal) => [
        `${goal.is_active ? "• " : ""}${escapeHtml(goal.name)}`,
        goal.start_date,
        goal.end_date,
        formatCurrency(goal.target_gmv),
        goalStatusBadge(goal),
        goal.id === activeGoalId ? activeRate : "—",
        `
          <button class="table-action" data-action="edit-goal" data-goal-id="${goal.id}">编辑</button>
          ${goal.is_active ? `<button class="table-action" data-action="pause-goal" data-goal-id="${goal.id}">停用</button>` : `<button class="table-action" data-action="activate-goal" data-goal-id="${goal.id}">启用</button>`}
          <button class="table-action danger" data-action="delete-goal" data-goal-id="${goal.id}">删除</button>
        `,
      ])
    : [["暂无目标", "—", "—", "—", '<span class="status gray">未配置</span>', "—", "—"]];
  const historyCards = goalRows.length
    ? goalRows
        .slice(0, 4)
        .map(
          (goal) => `
            <div class="card pad">
              <div class="metric-head">
                <div>
                  <div class="section-title">${escapeHtml(goal.name)}</div>
                  <div class="muted">${goal.start_date} → ${goal.end_date}</div>
                </div>
                ${goalStatusBadge(goal)}
              </div>
              <div class="placeholder-line"></div>
              <div class="goal-history-grid">
                <div><div class="muted">目标</div><div class="metric-value">${formatCurrency(goal.target_gmv)}</div></div>
                <div><div class="muted">状态</div><div class="metric-value goal-history-status">${goal.is_active ? "活动中" : goal.status === "completed" ? "已完成" : goal.status === "inactive" ? "已停用" : "待开始"}</div></div>
              </div>
            </div>
          `,
        )
        .join("")
    : `<div class="card pad"><div class="muted">还没有保存任何目标，先在上面填写一条活动目标就行。</div></div>`;
  return `
    <div class="card settings-card">
      <div class="metric-head">
        <div>
          <div class="section-title">Active Goal 设置</div>
          <div class="section-subtitle">北极星看板读取当前 Active Goal</div>
        </div>
        <span class="status">Active Goal</span>
      </div>
      <div class="placeholder-line"></div>
      <div class="grid cols-2 goal-settings-grid">
        <div>
          <div class="goal-title">${escapeHtml(activeGoal?.name || "还没有活动目标")}</div>
          <div class="muted">${activeGoal ? `${activeGoal.start_date} → ${activeGoal.end_date} · 目标 GMV ${formatCurrency(activeGoal.target_gmv)}` : "保存一条并勾选“设为活动目标”，北极星看板就会读取它。"}</div>
          <p class="muted">${escapeHtml(activeGoal?.description || "你可以在这里直接填写目标名称、目标周期和 GMV 目标，不用再去 SQL 手改。")}</p>
          <div class="goal-quick-stats">
            <div class="card pad"><div class="muted">当前活动目标</div><div class="metric-value">${activeGoal ? formatCurrency(activeGoal.target_gmv) : "—"}</div></div>
            <div class="card pad"><div class="muted">当前达成额</div><div class="metric-value">${activeActual}</div></div>
            <div class="card pad"><div class="muted">当前达成率</div><div class="metric-value">${activeRate}</div></div>
          </div>
        </div>
        <div class="card pad">
          <div class="field">
            <label>管理密钥 · 填 Vercel 中的 CRON_SECRET 后才能保存</label>
            <input data-integration-secret type="password" value="${state.integrationSecret}" placeholder="请输入 CRON_SECRET" />
          </div>
          <div class="form-grid goal-form-grid">
            <input type="hidden" data-goal-key="id" value="${escapeHtml(form.id || "")}" />
            <div class="field">
              <label>目标名称</label>
              <input data-goal-key="name" value="${escapeHtml(form.name || "")}" placeholder="例如：2026年9月 GMV百万计划" />
            </div>
            <div class="field">
              <label>目标 GMV</label>
              <input data-goal-key="target_gmv" type="number" min="0" step="0.01" value="${escapeHtml(form.target_gmv || "")}" placeholder="1000000" />
            </div>
            <div class="field">
              <label>开始日期</label>
              <input data-goal-key="start_date" type="date" value="${escapeHtml(form.start_date || "")}" />
            </div>
            <div class="field">
              <label>结束日期</label>
              <input data-goal-key="end_date" type="date" value="${escapeHtml(form.end_date || "")}" />
            </div>
            <div class="field" style="grid-column:1 / -1">
              <label>目标说明</label>
              <textarea data-goal-key="description" placeholder="例如：双十一预热期，目标聚焦单月 GMV 与 Sessions 提升。">${escapeHtml(form.description || "")}</textarea>
            </div>
            <label class="goal-toggle">
              <input data-goal-key="is_active" type="checkbox" ${form.is_active ? "checked" : ""} />
              <span>设为活动目标</span>
            </label>
          </div>
          <div class="button-row">
            <button class="ghost-btn" data-action="new-goal">＋ 新建空白目标</button>
            <button class="ghost-btn" data-action="pause-goal" data-goal-id="${escapeHtml(form.id || activeGoalId)}">停用当前活动目标</button>
            <button class="primary-btn" data-action="save-goal">保存目标</button>
          </div>
        </div>
      </div>
    </div>
    ${section("目标列表", "长期维护经营目标，同一时间仅允许一个 Active Goal", "", tableCard("", ["目标名称", "开始日期", "结束日期", "Target GMV", "状态", "当前达成率", "操作"], listRows))}
    ${section("历史目标", "已结算与进行中的目标达成情况", "", `<div class="grid cols-2">${historyCards}</div>`)}
  `;
}

function integrationPage() {
  const cards = [
    {
      source: "shopify",
      icon: "S",
      title: "Shopify 店铺",
      subtitle: "Shopify · Client Credentials",
      status: "待保存",
      fields: [
        ["shop_domain", "Store Domain · 店铺域名", "bohealthy.myshopify.com"],
        ["shop_name", "Shop Name · 店铺名称", state.storeName],
        ["client_id", "Client ID · Shopify App Client ID", ""],
        ["client_secret", "Client Secret · 仅服务端保存", ""],
        ["sync_interval", "同步频率", "每天一次"],
      ],
    },
    {
      source: "ga4",
      icon: "G",
      title: "Google Analytics 4",
      subtitle: "GA4 · Google OAuth",
      status: "未连接",
      fields: [
        ["property_id", "Property ID · GA4 属性 ID", ""],
        ["lookback_days", "回溯天数 · 每次同步最近多少天", "30"],
      ],
    },
    {
      source: "google_ads",
      icon: "A",
      title: "Google Ads",
      subtitle: "Google Ads · OAuth",
      status: "未连接",
      fields: [
        ["customer_id", "Customer ID · 广告账号 ID", ""],
        ["login_customer_id", "Login Customer ID · MCC 经理账号（可选）", ""],
        ["developer_token", "Developer Token · 仅服务端保存", ""],
        ["lookback_days", "回溯天数 · 每次同步最近多少天", "30"],
        ["sync_interval", "同步频率", "每 1 小时"],
      ],
    },
    {
      source: "meta_ads",
      icon: "M",
      title: "Meta Ads",
      subtitle: "Meta Ads · Manual Token",
      status: "未连接",
      fields: [
        ["app_id", "App ID · Meta 应用 ID", ""],
        ["ad_account_id", "Ad Account ID · 广告账户 ID", ""],
        ["access_token", "Access Token · 仅服务端保存", ""],
        ["sync_interval", "同步频率", "每 1 小时"],
      ],
    },
  ];
  return `
    <div class="grid cols-3" style="max-width:900px;margin:0 auto 24px">
      <div class="card pad"><div class="muted">集成总数</div><div class="metric-value" data-integration-summary="total">4</div></div>
      <div class="card pad"><div class="muted">已连接</div><div class="metric-value" style="color:var(--green)" data-integration-summary="connected">0</div></div>
      <div class="card pad"><div class="muted">连接异常</div><div class="metric-value" style="color:var(--red)" data-integration-summary="issues">0</div></div>
    </div>
    <div class="card pad" style="max-width:900px;margin:0 auto 24px">
      <div class="field">
        <label>管理密钥 · 填 Vercel 中的 CRON_SECRET 后才能保存/同步</label>
        <input data-integration-secret type="password" value="${state.integrationSecret}" placeholder="请输入 CRON_SECRET" />
      </div>
      <div class="button-row" style="margin-top:14px">
        <button class="ghost-btn" data-action="seed-demo-data">生成演示数据</button>
        <button class="ghost-btn" data-action="clear-demo-data">清空演示数据</button>
        <span class="muted">当 Shopify 还没有真实订单时，可一键灌入一套完整的演示数据。</span>
      </div>
    </div>
    <div class="grid" style="max-width:900px;margin:0 auto">
      ${cards
        .map(
          ({ source, icon, title, subtitle, status, fields }) => `
            <div class="card settings-card" data-integration-card="${source}">
              <div class="metric-head">
                <div style="display:flex;gap:14px;align-items:center">
                  <span class="source-icon" style="width:36px;height:36px;border-radius:7px;background:${icon === "G" ? "#f59e0b" : icon === "A" ? "#4f80ff" : icon === "M" ? "#3478f6" : "var(--green)"};color:#fff;font-weight:850">${icon}</span>
                  <div><div class="section-title" style="font-size:18px">${title}</div><div class="muted">${subtitle}</div></div>
                </div>
                <span class="status ${status === "未连接" ? "gray" : ""}" data-integration-status>${status}</span>
              </div>
              <div class="placeholder-line"></div>
              <div class="grid cols-4" style="margin-bottom:14px">
                <div class="card pad">
                  <div class="muted">Connection Status · 连接状态</div>
                  <div class="metric-label" data-integration-field="status_text">未连接</div>
                </div>
                <div class="card pad">
                  <div class="muted">${["ga4", "google_ads"].includes(source) ? "Google Account · 授权 Google 账号" : "Last Connected · 最近连接"}</div>
                  <div class="metric-label" data-integration-field="${["ga4", "google_ads"].includes(source) ? "account_identity" : "last_connected_at"}">${["ga4", "google_ads"].includes(source) ? "未绑定" : "—"}</div>
                </div>
                <div class="card pad">
                  <div class="muted">${["ga4", "google_ads"].includes(source) ? "Auth Mode · 授权方式" : "Last Tested · 最近测试"}</div>
                  <div class="metric-label" data-integration-field="${["ga4", "google_ads"].includes(source) ? "project_identity" : "last_tested_at"}">${["ga4", "google_ads"].includes(source) ? "Google OAuth" : "—"}</div>
                </div>
                <div class="card pad">
                  <div class="muted">Last Sync Time · 最近同步</div>
                  <div class="metric-label" data-integration-field="last_synced_at">—</div>
                </div>
              </div>
              <div class="form-grid">
                ${fields
                  .map(([key, label, value, kind]) => `
                    <div class="field">
                      <label>${label}</label>
                      ${
                        kind === "textarea"
                          ? `<textarea data-config-key="${key}" rows="6" placeholder="粘贴 Google Service Account JSON">${value}</textarea>`
                          : `<input data-config-key="${key}" value="${value}" ${/secret|token/i.test(key) ? 'type="password"' : ""} />`
                      }
                    </div>
                  `)
                  .join("")}
              </div>
              <div class="button-row">
                <button class="ghost-btn" data-action="disconnect-source">断开连接</button>
                <button class="ghost-btn" data-action="save-source" data-source="${source}">保存配置</button>
                ${["ga4", "google_ads"].includes(source) ? `<button class="ghost-btn" data-action="connect-google" data-source="${source}">连接 Google</button>` : ""}
                <button class="ghost-btn" data-action="test-source" data-source="${source}">测试连接</button>
                <button class="primary-btn" data-action="manual-sync" data-source="${source}">手动同步</button>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function couponsPage() {
  const rows = filteredCouponRows();

  return `
    ${section("券类概览", "按后台设置的券类统计；保存后会自动同步订单分类", "", `<div class="grid cols-3">
      <div class="card pad"><div class="metric-value" style="color:#7a55dc">新</div><h3>新人券</h3><p class="muted">面向首次购买或者新注册的专属优惠码</p><b>订单用量：55</b></div>
      <div class="card pad"><div class="metric-value" style="color:var(--green)">站</div><h3>站内活动券</h3><p class="muted">站内促销、节日活动等运营优惠码</p><b>订单用量：1,223</b></div>
      <div class="card pad"><div class="metric-value" style="color:#6375d6">达</div><h3>达人券</h3><p class="muted">KOL / 联盟达人专属优惠码，默认归类</p><b>订单用量：20,731</b></div>
    </div>`)}
    <div class="card settings-card">
      <div class="section-title">券码管理</div>
      <div class="button-row">
        <div class="search" style="flex:1"><input style="width:100%" placeholder="搜索券码、归属人、备注..." data-coupon-search value="${state.couponQuery}" /></div>
        <select data-coupon-filter style="height:40px;border:1px solid var(--line);border-radius:7px;padding:0 12px">
          ${["all", "启用", "停用", "达人券", "新人券", "站内活动券"].map((x) => `<option value="${x}" ${state.couponFilter === x ? "selected" : ""}>${x}</option>`).join("")}
        </select>
      </div>
      <div class="placeholder-line"></div>
      <div data-coupon-results>${couponTable(rows)}</div>
      <div class="muted" style="margin-top:16px">显示 <span data-coupon-count>${rows.length}</span> 条，共 10,299 条 <span style="float:right">第 1 / 206 页，共 10,299 条　上一页　下一页</span></div>
    </div>
  `;
}

function filteredCouponRows() {
  const sourceRows = state.couponsData?.length
    ? state.couponsData.map((row) => [row.code, row.category, row.owner || "-", formatInteger(row.usage_count), row.status || "启用"])
    : couponRows;
  const query = state.couponQuery.trim().toLowerCase();
  return sourceRows.filter((row) => {
    const matchesQuery = !query || row.join(" ").toLowerCase().includes(query);
    const matchesFilter =
      state.couponFilter === "all" || row[4] === state.couponFilter || row[1] === state.couponFilter;
    return matchesQuery && matchesFilter;
  });
}

function couponTable(rows) {
  return tableMarkup(
    ["券码", "分类", "归属人", "使用次数", "状态", "操作"],
    rows.map((r) => [
      r[0],
      pill(r[1], "blue"),
      r[2],
      r[3],
      `<span class="status ${r[4] === "停用" ? "gray" : ""}">${r[4]}</span>`,
      `<button class="table-action" data-action="edit-coupon">编辑</button><button class="table-action danger" data-action="delete-coupon">删除</button>`,
    ]),
  );
}

function miniRanks(rows = []) {
  const sourceRows = rows.length
    ? rows.slice(0, 6).map((row) => [row.province || row.country || row.name, formatCurrency(row.revenue), formatInteger(row.orders)])
    : [
        ["佛罗里达", "US$24,605.22", "128 单"],
        ["纽约", "US$23,985.05", "127 单"],
        ["加利福尼亚", "US$23,928.76", "124 单"],
        ["德克萨斯", "US$19,258.29", "112 单"],
        ["佐治亚", "US$17,628.89", "96 单"],
        ["新泽西", "US$13,536.94", "72 单"],
      ];
  return `
    <div class="mini-list">
      ${sourceRows
        .map((r, i) => `<div class="mini-rank"><b>${i + 1}</b><span>${r[0]}</span><strong>${r[1]}${r[2] ? `<small>${r[2]}</small>` : ""}</strong></div>`)
        .join("")}
    </div>
  `;
}

function render() {
  const page = currentPage();
  const pages = {
    northstar: northstarPage,
    personas: personasPage,
    operations: operationsPage,
    marketing: marketingPage,
    customers: customersPage,
    aarrr: aarrrPage,
    goals: goalsPage,
    integration: integrationPage,
    coupons: couponsPage,
  };
  app.innerHTML = layout(pages[page]());
  if (page === "goals") loadGoals();
  if (page === "integration") loadIntegrationConfigs();
  if (page === "coupons") loadCoupons();
  hydrateDashboardData();
  initializeSparklineTooltips();
  if (page === "integration") consumeOauthFeedback();
}

function consumeOauthFeedback() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("oauth_status");
  const source = params.get("oauth_source");
  if (!status || !["ga4", "google_ads"].includes(source)) return;

  const message = params.get("oauth_message");
  showToast(
    status === "connected"
      ? message || `${source === "google_ads" ? "Google Ads" : "GA4"} 已完成 Google 授权。`
      : `${source === "google_ads" ? "Google Ads" : "GA4"} Google 授权失败：${message || "请重试"}`,
  );
  history.replaceState({}, "", window.location.pathname);
  loadIntegrationConfigs();
}

app.addEventListener("click", (event) => {
  const pathButton = event.target.closest("[data-path]");
  if (pathButton) {
    navigate(pathButton.dataset.path);
    return;
  }

  const rangeButton = event.target.closest("[data-range]");
  if (rangeButton) {
    if (rangeButton.dataset.range === "自定义") {
      const currentRange = resolveDateRange();
      state.customRange.start = state.customRange.start || currentRange.start;
      state.customRange.end = state.customRange.end || currentRange.end;
      state.datePickerOpen = true;
      render();
      return;
    }
    state.range = rangeButton.dataset.range;
    state.datePickerOpen = false;
    invalidateDashboardData();
    render();
    showToast(`时间范围已切换为：${state.range}`);
    return;
  }

  const sourceButton = event.target.closest("[data-source-tab]");
  if (sourceButton) {
    state.sourceTab = sourceButton.dataset.sourceTab;
    render();
    showToast(`已切换数据源：${state.sourceTab}`);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    handleAction(actionButton.dataset.action, actionButton);
  }
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-integration-secret]")) {
    state.integrationSecret = event.target.value;
    return;
  }

  if (event.target.matches("[data-custom-start]")) {
    state.customRange.start = event.target.value;
    return;
  }

  if (event.target.matches("[data-custom-end]")) {
    state.customRange.end = event.target.value;
    return;
  }

  if (event.target.matches("[data-sim-key]")) {
    if (!state.dashboardData?.active_goal) return;
    const simulator = ensureSimulatorState(state.dashboardData.active_goal);
    simulator[event.target.dataset.simKey] = Number(event.target.value || 0);
    updateGrowthSimulator(state.dashboardData.active_goal);
    return;
  }

  if (!event.target.matches("[data-coupon-search]")) return;
  state.couponQuery = event.target.value;
  updateCouponResults();
});

app.addEventListener("change", (event) => {
  if (!event.target.matches("[data-coupon-filter]")) return;
  state.couponFilter = event.target.value;
  updateCouponResults();
  showToast(`券码筛选：${state.couponFilter}`);
});

function updateCouponResults() {
  const rows = filteredCouponRows();
  const results = document.querySelector("[data-coupon-results]");
  const count = document.querySelector("[data-coupon-count]");
  if (results) results.innerHTML = couponTable(rows);
  if (count) count.textContent = rows.length;
}

function applyCustomRange() {
  if (!state.customRange.start || !state.customRange.end) {
    showToast("请选择开始日期和结束日期。");
    return;
  }

  if (state.customRange.start > state.customRange.end) {
    showToast("开始日期不能晚于结束日期。");
    return;
  }

  state.range = "自定义";
  state.datePickerOpen = false;
  invalidateDashboardData();
  render();
  showToast(`时间范围已切换为：${state.customRange.start} → ${state.customRange.end}`);
}

function invalidateDashboardData() {
  state.dashboardData = null;
  state.dashboardDataKey = "";
}

async function handleAction(action, button) {
  if (action === "close-date-picker") {
    state.datePickerOpen = false;
    render();
    return;
  }

  if (action === "apply-date-range") {
    applyCustomRange();
    return;
  }

  if (action === "reset-simulator") {
    resetSimulator();
    return;
  }

  if (action === "save-source") {
    await saveIntegration(button);
    return;
  }

  if (action === "test-source") {
    await saveIntegration(button);
    if (button?.dataset.source === "shopify") await runShopifySync("test");
    if (button?.dataset.source === "ga4") await runGa4Sync("test");
    if (button?.dataset.source === "google_ads") await runGoogleAdsSync("test");
    return;
  }

  if (action === "connect-google") {
    await startGoogleOAuth(button);
    return;
  }

  if (action === "manual-sync") {
    if (button?.dataset.source === "shopify") {
      await runShopifySync();
    } else if (button?.dataset.source === "ga4") {
      await runGa4Sync();
    } else if (button?.dataset.source === "google_ads") {
      await runGoogleAdsSync();
    } else {
      showToast("这个数据源的同步接口还没接入，当前先接通 Shopify、GA4 和 Google Ads。");
    }
    return;
  }

  if (action === "sync-coupons") {
    await syncCoupons();
    return;
  }

  if (action === "seed-demo-data") {
    await seedDemoData();
    return;
  }

  if (action === "clear-demo-data") {
    await clearDemoData();
    return;
  }

  if (action === "save-goal") {
    await saveGoal();
    return;
  }

  if (action === "activate-goal") {
    await setGoalActive(button?.dataset.goalId, true);
    return;
  }

  if (action === "pause-goal") {
    await setGoalActive(button?.dataset.goalId, false);
    return;
  }

  if (action === "edit-goal") {
    editGoal(button?.dataset.goalId);
    return;
  }

  if (action === "delete-goal") {
    await deleteGoal(button?.dataset.goalId);
    return;
  }

  if (action === "disconnect-source") {
    await disconnectSource(button);
    return;
  }

  const messages = {
    logout: "这是演示前台，真实登录退出需要接 Supabase Auth。",
    notifications: "暂无新通知。",
    "sync-coupons": "已模拟同步订单分类；真实环境会触发 Vercel API。",
    "new-coupon": "已打开新增券码入口；接 Shopify 后可同步 Price Rule。",
    "edit-coupon": "已进入券码编辑状态。",
    "delete-coupon": "已模拟删除券码；真实环境会二次确认。",
    "disconnect-source": "已模拟断开连接。",
    "save-source": "配置已模拟保存。",
    "test-source": "连接测试已触发。",
    "manual-sync": "已触发手动同步任务。",
  };
  if (action === "new-goal") {
    state.goalForm = defaultGoalForm();
    render();
    showToast("已切换到空白目标表单。");
    return;
  }
  showToast(messages[action] || "操作已触发。");
}

async function loadGoals() {
  try {
    const response = await fetch("/api/goals");
    if (!response.ok) return;
    const data = await response.json();
    if (!data.ok) return;
    state.goalsData = data;
    if (!state.goalForm || !state.goalForm.id) {
      state.goalForm = defaultGoalForm(data.active_goal);
    } else {
      const match = (data.goals || []).find((goal) => goal.id === state.goalForm.id);
      if (match) state.goalForm = defaultGoalForm(match);
    }
    if (data.primary_shop?.shop_name) updateStoreIdentity(data.primary_shop.shop_name);
    if (currentPage() === "goals") {
      app.innerHTML = layout(goalsPage());
    }
  } catch {
    // Keep local fallback content if API is unavailable.
  }
}

function defaultGoalForm(goal = null) {
  return {
    id: goal?.id || "",
    name: goal?.name || "",
    description: goal?.description || "",
    start_date: goal?.start_date || "",
    end_date: goal?.end_date || "",
    target_gmv: goal?.target_gmv || "",
    is_active: Boolean(goal?.is_active || goal?.status === "active"),
  };
}

function goalStatusBadge(goal) {
  if (goal?.is_active || goal?.status === "active") return '<span class="status">活动中</span>';
  if (goal?.status === "completed") return '<span class="status">已完成</span>';
  if (goal?.status === "inactive") return '<span class="status gray">已停用</span>';
  return '<span class="status gray">待开始</span>';
}

function readGoalForm() {
  const values = {};
  document.querySelectorAll("[data-goal-key]").forEach((input) => {
    values[input.dataset.goalKey] = input.type === "checkbox" ? input.checked : input.value;
  });
  return values;
}

function editGoal(goalId) {
  const goal = state.goalsData?.goals?.find((item) => item.id === goalId);
  if (!goal) return showToast("没有找到这条目标。");
  state.goalForm = defaultGoalForm(goal);
  render();
  showToast(`已载入目标：${goal.name}`);
}

async function saveGoal() {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");
  const form = readGoalForm();

  try {
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({
        ...form,
        target_gmv: Number(form.target_gmv || 0),
        status: form.is_active ? "active" : "draft",
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "保存失败");
    showToast("目标已保存。");
    await loadGoals();
    invalidateDashboardData();
    await hydrateDashboardData();
  } catch (error) {
    showToast(`保存失败：${error.message}`);
  }
}

async function setGoalActive(goalId, isActive) {
  const id = String(goalId || state.goalsData?.active_goal?.id || state.goalForm?.id || "").trim();
  if (!id) return showToast("没有找到要更新的目标。");
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  try {
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({
        id,
        is_active: isActive,
        status: isActive ? "active" : "inactive",
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "更新失败");
    showToast(isActive ? "已启用为活动目标。" : "已停用当前目标。");
    await loadGoals();
    invalidateDashboardData();
    await hydrateDashboardData();
  } catch (error) {
    showToast(`更新失败：${error.message}`);
  }
}

async function deleteGoal(goalId) {
  const id = String(goalId || "").trim();
  if (!id) return showToast("没有找到要删除的目标。");
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  try {
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "删除失败");
    if (state.goalForm?.id === id) state.goalForm = defaultGoalForm();
    showToast("目标已删除。");
    await loadGoals();
    invalidateDashboardData();
    await hydrateDashboardData();
  } catch (error) {
    showToast(`删除失败：${error.message}`);
  }
}

function resetSimulator() {
  if (!state.dashboardData?.active_goal) return;
  state.simulator = null;
  updateGrowthSimulator(state.dashboardData.active_goal);
  showToast("已重置为当前能力。");
}

async function saveIntegration(button) {
  const card = button?.closest("[data-integration-card]");
  const source = button?.dataset.source || card?.dataset.integrationCard;
  if (!card || !source) return showToast("没有找到当前集成配置。");
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  const config = {};
  card.querySelectorAll("[data-config-key]").forEach((input) => {
    config[input.dataset.configKey] = input.value;
  });

  try {
    const response = await fetch("/api/integrations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({
        source,
        config: ["ga4", "google_ads"].includes(source) ? { ...config, auth_mode: "oauth" } : config,
        status: ["ga4", "google_ads"].includes(source) ? "configured" : "connected",
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "保存失败");
    showToast(`${sourceLabel(source)} 配置已保存到 Supabase。`);
    loadIntegrationConfigs();
    return true;
  } catch (error) {
    showToast(`保存失败：${error.message}`);
    return false;
  }
}

async function disconnectSource(button) {
  const card = button?.closest("[data-integration-card]");
  const source = card?.dataset.integrationCard;
  if (!source) return showToast("没有找到当前集成配置。");
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  try {
    const response = await fetch("/api/integrations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({
        source,
        status: "disconnected",
        config: {},
        clear_keys:
          source === "ga4"
            ? ["refresh_token", "google_account_email", "google_project_id", "google_auth_mode", "service_account_json", "auth_mode"]
            : source === "google_ads"
              ? ["refresh_token", "google_account_email", "google_auth_mode", "customer_name", "auth_mode"]
              : [],
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "断开失败");
    showToast(`${sourceLabel(source)} 已断开。`);
    loadIntegrationConfigs();
  } catch (error) {
    showToast(`断开失败：${error.message}`);
  }
}

async function startGoogleOAuth(button) {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");
  const saved = await saveIntegration(button);
  if (!saved) return;
  const source = String(button?.dataset.source || "ga4");

  showToast("正在跳转到 Google 授权页...");
  try {
    const response = await fetch("/api/oauth/google/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({ source }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.auth_url) throw new Error(data.error || "无法发起 Google 授权");
    window.location.href = data.auth_url;
  } catch (error) {
    showToast(`Google 授权启动失败：${error.message}`);
  }
}

async function runShopifySync(mode = "sync") {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast(mode === "test" ? "正在测试 Shopify 连接..." : "正在触发 Shopify 同步...");
  try {
    const suffix = mode === "test" ? "&mode=test" : "";
    const response = await fetch(`/api/sync/shopify-orders?secret=${encodeURIComponent(state.integrationSecret)}${suffix}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "同步失败");
    await loadIntegrationConfigs();
    if (mode === "test") {
      showToast("Shopify 连接测试通过。");
      return;
    }
    state.dashboardData = null;
    await hydrateDashboardData();
    showToast(`Shopify 同步完成：订单 ${data.imported_orders}，明细 ${data.imported_line_items}`);
  } catch (error) {
    showToast(`同步失败：${error.message}`);
  }
}

async function runGa4Sync(mode = "sync") {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast(mode === "test" ? "正在测试 GA4 连接..." : "正在同步 GA4 数据...");
  try {
    const suffix = mode === "test" ? "&mode=test" : "";
    const response = await fetch(`/api/sync/ga4?secret=${encodeURIComponent(state.integrationSecret)}${suffix}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "GA4 同步失败");
    await loadIntegrationConfigs();
    if (mode === "test") {
      showToast(`GA4 连接测试通过：Property ${data.property_id}`);
      return;
    }
    state.dashboardData = null;
    await hydrateDashboardData();
    showToast(`GA4 同步完成：日指标 ${data.synced_daily_rows}，画像分群 ${data.synced_segment_rows}`);
  } catch (error) {
    showToast(`GA4 操作失败：${error.message}`);
  }
}

async function runGoogleAdsSync(mode = "sync") {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast(mode === "test" ? "正在测试 Google Ads 连接..." : "正在同步 Google Ads 数据...");
  try {
    const suffix = mode === "test" ? "&mode=test" : "";
    const response = await fetch(`/api/sync/google-ads?secret=${encodeURIComponent(state.integrationSecret)}${suffix}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Google Ads 同步失败");
    await loadIntegrationConfigs();
    if (mode === "test") {
      showToast(`Google Ads 连接测试通过：${data.customer_name || data.customer_id}`);
      return;
    }
    state.dashboardData = null;
    await hydrateDashboardData();
    showToast(`Google Ads 同步完成：${data.synced_rows} 条日广告数据`);
  } catch (error) {
    showToast(`Google Ads 操作失败：${error.message}`);
  }
}

async function syncCoupons() {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast("正在同步优惠券分类...");
  try {
    const response = await fetch(`/api/sync/coupons?secret=${encodeURIComponent(state.integrationSecret)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "同步失败");
    state.couponsData = null;
    await loadCoupons();
    state.dashboardData = null;
    await hydrateDashboardData();
    showToast(`优惠券同步完成：${data.synced_coupons} 个券码`);
  } catch (error) {
    showToast(`优惠券同步失败：${error.message}`);
  }
}

async function seedDemoData() {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast("正在生成演示数据...");
  try {
    const response = await fetch("/api/demo/seed", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({
        action: "seed",
        days: 30,
        shop_name: state.storeName || "Canoly Demo Store",
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(describeApiError(data, "演示数据生成失败"));
    }
    invalidateDashboardData();
    await Promise.all([hydrateDashboardData(), loadGoals(), loadCoupons(), loadIntegrationConfigs()]);
    showToast(`演示数据已生成：订单 ${data.seeded.orders}，GA4 ${data.seeded.ga4_daily_rows} 天，广告 ${data.seeded.ad_daily_rows} 条`);
  } catch (error) {
    showToast(`生成失败：${error.message}`);
  }
}

async function clearDemoData() {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast("正在清空演示数据...");
  try {
    const response = await fetch("/api/demo/seed", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.integrationSecret}`,
      },
      body: JSON.stringify({ action: "clear" }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(describeApiError(data, "演示数据清空失败"));
    }
    invalidateDashboardData();
    await Promise.all([hydrateDashboardData(), loadGoals(), loadCoupons(), loadIntegrationConfigs()]);
    showToast("演示数据已清空。");
  } catch (error) {
    showToast(`清空失败：${error.message}`);
  }
}

function describeApiError(data, fallback) {
  const base = String(data?.error || fallback || "请求失败");
  const details = data?.details;
  if (!details) return base;

  if (typeof details === "string") return `${base}：${details}`;
  if (details.message) return `${base}：${details.message}`;
  if (details.table) {
    const hint = details.code || details.hint || details.details || "";
    return `${base}（${details.table}${hint ? ` · ${hint}` : ""}）`;
  }
  if (details.code || details.hint || details.details) {
    return `${base}：${[details.code, details.hint, details.details].filter(Boolean).join(" / ")}`;
  }
  return base;
}

async function loadIntegrationConfigs() {
  try {
    const response = await fetch("/api/integrations");
    if (!response.ok) return;
    const data = await response.json();
    if (!data.ok) return;

    const integrations = data.integrations || [];
    const connectedCount = integrations.filter((item) => item.status === "connected").length;
    const issueCount = integrations.filter((item) => item.status && item.status !== "connected" && item.status !== "disconnected").length;
    updateIntegrationSummary("total", 4);
    updateIntegrationSummary("connected", connectedCount);
    updateIntegrationSummary("issues", issueCount);

    for (const item of integrations) {
      const card = document.querySelector(`[data-integration-card="${item.source}"]`);
      if (!card) continue;
      for (const [key, value] of Object.entries(item.config || {})) {
        const input = card.querySelector(`[data-config-key="${key}"]`);
        if (input) input.value = value;
      }
      const status = card.querySelector("[data-integration-status]");
      if (status) {
        status.textContent = integrationStatusLabel(item.status);
        status.classList.toggle("gray", !["connected", "configured"].includes(item.status));
      }
      updateIntegrationField(card, "status_text", integrationStatusDetail(item.status));
      updateIntegrationField(card, "last_connected_at", formatMaybeDate(item.last_connected_at));
      updateIntegrationField(card, "last_tested_at", formatMaybeDate(item.last_tested_at));
      updateIntegrationField(card, "last_synced_at", formatMaybeDate(item.last_synced_at));
      if (item.source === "ga4") {
        updateIntegrationField(
          card,
          "account_identity",
          item.config?.google_account_email
            ? `已绑定（${item.config.google_account_email}）`
            : item.status === "connected"
              ? "已连接（邮箱未记录）"
              : "未绑定",
        );
        updateIntegrationField(
          card,
          "project_identity",
          item.config?.google_auth_mode || item.config?.google_project_id || "Google OAuth",
        );
      }
      if (item.source === "google_ads") {
        updateIntegrationField(
          card,
          "account_identity",
          item.config?.google_account_email
            ? `已绑定（${item.config.google_account_email}）`
            : item.status === "connected"
              ? "已连接（邮箱未记录）"
              : "未绑定",
        );
        updateIntegrationField(
          card,
          "project_identity",
          item.config?.customer_name || item.config?.customer_id || "Google Ads 账号",
        );
      }
      if (item.source === "shopify") {
        const shopName = item.config?.shop_name || data.primary_shop?.shop_name;
        if (shopName) updateStoreIdentity(shopName);
      }
    }

    if (data.primary_shop?.shop_name) updateStoreIdentity(data.primary_shop.shop_name);
  } catch {
    // Keep form defaults when API is unavailable.
  }
}

function updateIntegrationSummary(key, value) {
  const node = document.querySelector(`[data-integration-summary="${key}"]`);
  if (node) node.textContent = String(value);
}

function updateStoreIdentity(name) {
  const safeName = String(name || "").trim() || "Canoly";
  state.storeName = safeName;
  const brand = document.querySelector("[data-brand-title]");
  const chip = document.querySelector("[data-store-name]");
  const avatar = document.querySelector("[data-store-avatar]");
  if (brand) brand.textContent = safeName;
  if (chip) chip.textContent = safeName;
  if (avatar) avatar.textContent = initialOf(safeName);
}

function updateIntegrationField(card, key, value) {
  const node = card.querySelector(`[data-integration-field="${key}"]`);
  if (node) node.textContent = value;
}

function integrationStatusLabel(status) {
  return {
    connected: "已连接",
    configured: "已保存待测试",
    disconnected: "未连接",
    error: "异常",
    running: "同步中",
  }[status] || "未连接";
}

function integrationStatusDetail(status) {
  return {
    connected: "已连接",
    configured: "已保存待测试",
    disconnected: "未连接",
    error: "连接异常",
    running: "同步中",
  }[status] || "未连接";
}

function formatMaybeDate(value) {
  return value ? formatDateTime(value) : "—";
}

async function loadCoupons() {
  try {
    const response = await fetch("/api/coupons");
    if (!response.ok) return;
    const data = await response.json();
    if (!data.ok) return;
    state.couponsData = data.coupons || [];
    updateCouponResults();
  } catch {
    // Keep mock coupons in place if API is unavailable.
  }
}

function sourceLabel(source) {
  return {
    shopify: "Shopify",
    ga4: "GA4",
    google_ads: "Google Ads",
    meta_ads: "Meta Ads",
  }[source] || source;
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function hydrateDashboardData() {
  const rangeQuery = buildDashboardRangeQuery();
  const requestKey = rangeQuery || "default";

  if (state.dashboardData && state.dashboardDataKey === requestKey) {
    applyDashboardData(state.dashboardData);
    return;
  }

  try {
    const response = await fetch(`/api/dashboard/shopify${rangeQuery ? `?${rangeQuery}` : ""}`);
    if (!response.ok) return;
    const data = await response.json();
    if (!data.ok) return;
    state.dashboardData = data;
    state.dashboardDataKey = requestKey;
    applyDashboardData(data);
  } catch {
    // Keep mock data visible when the local static preview has no API runtime.
  }
}

function buildDashboardRangeQuery() {
  const range = resolveDateRange();
  const params = new URLSearchParams();
  if (range.start) params.set("start", range.start);
  if (range.end) params.set("end", range.end);
  return params.toString();
}

function resolveDateRange() {
  const today = new Date();
  const end = formatDateInputValue(today);

  if (state.range === "今天") {
    return { start: end, end };
  }

  if (state.range === "昨天") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const day = formatDateInputValue(yesterday);
    return { start: day, end: day };
  }

  if (state.range === "近 7 天") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start: formatDateInputValue(start), end };
  }

  if (state.range === "自定义" && state.customRange.start && state.customRange.end) {
    return { start: state.customRange.start, end: state.customRange.end };
  }

  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  return { start: formatDateInputValue(start), end };
}

function applyDashboardData(data) {
  const summary = data.summary || {};
  const activeGoal = data.active_goal || null;
  const customerQuality = data.customer_quality || {};
  const previous = data.previous || {};
  const previousSummary = previous.summary || {};
  const previousCustomerCouponSegments = previous.customer_coupon_segments || [];
  const previousCustomerQuality = previous.customer_quality || {};
  const referral = data.referral || {};
  const previousReferral = previous.referral || {};
  const previousGa4Funnel = previous.ga4_funnel || {};
  const adTotals = buildAdTotals(data.ad_performance || []);
  const previousAdTotals = buildAdTotals(previous.ad_performance || []);
  const channelMix = buildChannelMix(data.channel_sales || [], data.ad_performance || []);
  const funnelSteps = buildFunnelSteps(data.ga4_funnel || {}, adTotals, summary);
  const values = {
    gmv: formatCurrency(summary.gmv),
    net_sales: formatCurrency(summary.net_sales),
    orders: formatInteger(summary.orders),
    customers: formatInteger(summary.customers),
    aov: formatCurrency(summary.aov),
    gross_sales: formatCurrency(summary.gross_sales),
    refunds: formatCurrency(summary.refunds),
    refund_rate: `${formatNumber(summary.refund_rate)}%`,
    coupon_order_rate: `${formatNumber(summary.coupon_order_rate)}%`,
    new_customer_revenue: formatCurrency(customerQuality.new_customer_revenue),
    returning_customer_revenue: formatCurrency(customerQuality.returning_customer_revenue),
    new_customers: formatInteger(customerQuality.new_customers),
    returning_customers: formatInteger(customerQuality.returning_customers),
    new_customer_orders: formatInteger(customerQuality.new_customer_orders),
    returning_customer_orders: formatInteger(customerQuality.returning_customer_orders),
    repeat_rate: `${formatNumber(customerQuality.repeat_rate)}%`,
    avg_customer_value: formatCurrency(customerQuality.avg_customer_value),
    purchase_frequency: formatNumber(customerQuality.purchase_frequency),
    achievement_rate: `${formatNumber((summary.gmv / 1000000) * 100)}%`,
  };

  document.querySelectorAll("[data-metric]").forEach((node) => {
    const value = values[node.dataset.metric];
    if (value !== undefined) node.textContent = value;
  });

  const cardDelta = {
    gmv: compareDelta(summary.gmv, previousSummary.gmv),
    gross_sales: compareDelta(summary.gross_sales, previousSummary.gross_sales),
    orders: compareDelta(summary.orders, previousSummary.orders),
    aov: compareDelta(summary.aov, previousSummary.aov),
    refunds: compareDelta(summary.refunds, previousSummary.refunds),
    sessions: compareDelta(data.ga4_funnel?.sessions, previousGa4Funnel.sessions),
    spend: compareDelta(adTotals.spend, previousAdTotals.spend),
    cpc: compareDelta(adTotals.cpc, previousAdTotals.cpc),
    cpm: compareDelta(adTotals.cpm, previousAdTotals.cpm),
    cvr: compareDelta(data.ga4_funnel?.cvr, previousGa4Funnel.cvr),
    add_to_cart_rate: compareDelta(data.ga4_funnel?.add_to_cart_rate, previousGa4Funnel.add_to_cart_rate),
    checkout_rate: compareDelta(data.ga4_funnel?.checkout_rate, previousGa4Funnel.checkout_rate),
    payment_completion_rate: compareDelta(data.ga4_funnel?.payment_completion_rate, previousGa4Funnel.payment_completion_rate),
    new_customer_revenue: compareDelta(customerQuality.new_customer_revenue, previousCustomerQuality.new_customer_revenue),
    returning_customer_revenue: compareDelta(customerQuality.returning_customer_revenue, previousCustomerQuality.returning_customer_revenue),
    new_customers: compareDelta(customerQuality.new_customers, previousCustomerQuality.new_customers),
    returning_customers: compareDelta(customerQuality.returning_customers, previousCustomerQuality.returning_customers),
    new_customer_orders: compareDelta(customerQuality.new_customer_orders, previousCustomerQuality.new_customer_orders),
    returning_customer_orders: compareDelta(customerQuality.returning_customer_orders, previousCustomerQuality.returning_customer_orders),
    repeat_rate: compareDelta(customerQuality.repeat_rate, previousCustomerQuality.repeat_rate),
    avg_customer_value: compareDelta(customerQuality.avg_customer_value, previousCustomerQuality.avg_customer_value),
    purchase_frequency: compareDelta(customerQuality.purchase_frequency, previousCustomerQuality.purchase_frequency),
    cac: compareDelta(
      customerQuality.new_customers ? adTotals.spend / customerQuality.new_customers : 0,
      previousCustomerQuality.new_customers ? previousAdTotals.spend / previousCustomerQuality.new_customers : 0,
    ),
    coupon_order_rate: compareDelta(summary.coupon_order_rate, previousSummary.coupon_order_rate),
    affiliate_orders: compareDelta(referral.affiliate_orders, previousReferral.affiliate_orders),
    affiliate_revenue: compareDelta(referral.affiliate_revenue, previousReferral.affiliate_revenue),
    affiliate_order_share: compareDelta(referral.affiliate_order_share, previousReferral.affiliate_order_share),
    influencer_coupon_orders: compareDelta(referral.influencer_coupon_orders, previousReferral.influencer_coupon_orders),
    influencer_coupon_revenue: compareDelta(referral.influencer_coupon_revenue, previousReferral.influencer_coupon_revenue),
  };

  const progress = document.querySelector(".progress > span");
  if (progress && activeGoal?.achievement_rate !== undefined) {
    progress.style.width = `${Math.max(0, Math.min(100, activeGoal.achievement_rate))}%`;
  } else if (progress && summary.gmv !== undefined) {
    progress.style.width = `${Math.max(0, Math.min(100, (summary.gmv / 1000000) * 100))}%`;
  }

  const syncBar = document.querySelector(".sync-bar");
  if (syncBar && data.sync?.last_synced_at) {
    syncBar.innerHTML = `Last Sync Time: <strong>${formatDateTime(data.sync.last_synced_at)}</strong>`;
  }

  const operationsContent = document.querySelector("[data-operations-content]");
  if (operationsContent) {
    operationsContent.innerHTML = renderOperationsDashboard(data, cardDelta);
  }

  const personaOverview = document.querySelector("[data-persona-overview]");
  if (personaOverview) {
    personaOverview.innerHTML = renderPersonaOverviewSections(
      data.audience?.overview || {},
      data.shopify_persona || {},
      data.sync || {},
    );
  }

  const personaGa4 = document.querySelector('[data-persona-source="ga4"]');
  if (personaGa4) {
    personaGa4.innerHTML = renderPersonaSourceSections("GA4", data.audience?.sources?.ga4 || {}, data.sync || {});
  }

  const personaGoogleAds = document.querySelector('[data-persona-source="google_ads"]');
  if (personaGoogleAds) {
    personaGoogleAds.innerHTML = renderPersonaSourceSections("Google Ads", data.audience?.sources?.google_ads || {}, data.sync || {});
  }

  const personaMetaAds = document.querySelector('[data-persona-source="meta_ads"]');
  if (personaMetaAds) {
    personaMetaAds.innerHTML = renderPersonaSourceSections("Meta Ads", data.audience?.sources?.meta_ads || {}, data.sync || {});
  }

  const personaShopify = document.querySelector("[data-persona-shopify]");
  if (personaShopify) {
    personaShopify.innerHTML = renderShopifyPersonaSections(data.shopify_persona || {});
  }

  const topProducts = document.querySelector("[data-top-products]");
  if (topProducts && data.top_products?.length) {
    topProducts.innerHTML = tableCard(
      "",
      ["#", "商品", "销量", "销售额"],
      data.top_products.map((row, index) => [
        index + 1,
        `${escapeHtml(row.title)}${row.sku ? `<div class="small-label">${escapeHtml(row.sku)}</div>` : ""}`,
        formatInteger(row.units_sold),
        formatCurrency(row.revenue),
      ]),
    );
  }

  const countrySales = document.querySelector("[data-country-sales]");
  if (countrySales && data.country_sales?.length) {
    countrySales.innerHTML = tableCard(
      "国家分布",
      ["地区", "客户数", "销售额", "客单价", "占比"],
      data.country_sales.map((row) => [
        escapeHtml(row.country),
        formatInteger(row.customers),
        formatCurrency(row.revenue),
        formatCurrency(row.aov),
        `${formatNumber(row.order_share)}%`,
      ]),
    );
  }

  const customerSegments = document.querySelector("[data-customer-segments]");
  if (customerSegments && data.customer_segments?.length) {
    const totalRevenue = data.customer_segments.reduce((sum, row) => sum + Number(row.revenue || 0), 0) || 1;
    customerSegments.innerHTML = tableCard(
      "用户分群",
      ["分类", "客户数", "销售额", "占比"],
      data.customer_segments.map((row) => [
        escapeHtml(row.segment),
        formatInteger(row.customers),
        formatCurrency(row.revenue),
        `${formatNumber((row.revenue / totalRevenue) * 100)}%`,
      ]),
    );
  }

  const couponUsageSummary = document.querySelector("[data-coupon-usage-summary]");
  if (couponUsageSummary && data.coupon_usage?.length) {
    couponUsageSummary.innerHTML = tableCard(
      "优惠券使用",
      ["分类", "订单数", "占比"],
      data.coupon_usage.map((row) => [
        escapeHtml(row.category),
        formatInteger(row.orders),
        `${formatNumber(row.order_share)}%`,
      ]),
    );
  }

  const couponUsageBreakdown = document.querySelector("[data-coupon-usage-breakdown]");
  if (couponUsageBreakdown && data.coupon_usage?.length) {
    couponUsageBreakdown.innerHTML = tableCard(
      "优惠券类型分布",
      ["分类", "订单数", "销售额", "占比"],
      data.coupon_usage.map((row) => [
        escapeHtml(row.category),
        formatInteger(row.orders),
        formatCurrency(row.revenue),
        `${formatNumber(row.order_share)}%`,
      ]),
    );
  }

  if (activeGoal) {
    const goalName = document.querySelector("[data-goal-name]");
    if (goalName) goalName.textContent = activeGoal.name;

    const goalPeriod = document.querySelector("[data-goal-period]");
    if (goalPeriod) {
      goalPeriod.textContent = `目标周期 ${activeGoal.start_date} → ${activeGoal.end_date} · 目标 GMV ${formatCurrency(activeGoal.target_gmv)}`;
    }

    const goalStatus = document.querySelector("[data-goal-status]");
    if (goalStatus) {
      const statusMap = {
        "On Track": pill("达标中 On Track"),
        Watch: pill("需要关注 Watch", "orange"),
        "Off Track": pill("严重偏离 Off Track", "red"),
      };
      goalStatus.innerHTML = statusMap[activeGoal.status] || pill(activeGoal.status || "进行中");
    }

    const goalProgressLabel = document.querySelector("[data-goal-progress-label]");
    if (goalProgressLabel) {
      goalProgressLabel.innerHTML = `当前目标达成率 <span>${formatNumber(activeGoal.achievement_rate)}%</span> / 目标`;
    }

    const goalProgressValue = document.querySelector("[data-goal-progress-value]");
    if (goalProgressValue) {
      goalProgressValue.innerHTML = `${formatCurrency(activeGoal.current_goal_gmv)} / ${formatCurrency(activeGoal.target_gmv)}`;
    }

    const goalProgressBar = document.querySelector("[data-goal-progress-bar]");
    if (goalProgressBar) {
      goalProgressBar.style.width = `${Math.min(activeGoal.achievement_rate, 100)}%`;
    }

    const goalSummary = document.querySelector("[data-goal-summary]");
    if (goalSummary) {
      goalSummary.innerHTML = [
        ["目标月份", `${formatMonthLabel(activeGoal.start_date)}`],
        ["目标 GMV", formatCurrency(activeGoal.target_gmv)],
        ["当前月度能力", formatCurrency(activeGoal.monthly_gmv_run_rate), "var(--green)"],
        ["目标差距", formatCurrency(activeGoal.capability_gap ?? activeGoal.gap), "var(--red)"],
        [`${activeRangeLabel()} GMV`, formatCurrency(activeGoal.current_range_gmv)],
      ]
        .map(
          ([label, value, color]) => `
            <div class="card pad">
              <div class="metric-label">${label}</div>
              <div class="metric-value" style="${color ? `color:${color}` : ""}">${value}</div>
            </div>
          `,
        )
        .join("");
    }

    const goalBreakdown = document.querySelector("[data-goal-breakdown]");
    if (goalBreakdown) {
      goalBreakdown.innerHTML = goalBreakdownPanel("目标拆解", "Target Breakdown", [
        ["达标所需日均 GMV", "Required Daily GMV", formatCurrency(activeGoal.required_daily_gmv)],
        ["达标所需日均订单数", "Required Daily Orders", formatNumber(activeGoal.required_daily_orders)],
        ["达标所需月订单数", "Required Monthly Orders", formatInteger(activeGoal.required_monthly_orders)],
        ["达标所需 Sessions", "Required Monthly Sessions", formatInteger(activeGoal.required_monthly_sessions)],
        ["当前 AOV", "Current AOV", formatCurrency(activeGoal.current_aov)],
        ["当前 CVR", "Current CVR", `${formatNumber(activeGoal.current_cvr)}%`],
      ]);
    }

    const currentCapability = document.querySelector("[data-current-capability]");
    if (currentCapability) {
      currentCapability.innerHTML = goalBreakdownPanel("当前能力评估", "Current Capability", [
        ["当前月度 GMV Run Rate", "Monthly GMV Run Rate", formatCurrency(activeGoal.monthly_gmv_run_rate), "var(--green)"],
        ["当前月度订单 Run Rate", "Monthly Orders Run Rate", formatInteger(activeGoal.monthly_orders_run_rate)],
        ["当前月度 Sessions Run Rate", "Monthly Sessions Run Rate", formatInteger(activeGoal.monthly_sessions_run_rate)],
        ["当前 CVR", "Current CVR", `${formatNumber(activeGoal.current_cvr)}%`],
        ["当前 AOV", "Current AOV", formatCurrency(activeGoal.current_aov)],
        ["预测月 GMV", "Forecast Month GMV", formatCurrency(activeGoal.forecast_goal_gmv), "var(--green)"],
      ]);
    }

    ensureSimulatorState(activeGoal);
    updateGrowthSimulator(activeGoal);
  } else {
    const goalName = document.querySelector("[data-goal-name]");
    if (goalName) goalName.textContent = "暂无 Active Goal";

    const goalPeriod = document.querySelector("[data-goal-period]");
    if (goalPeriod) goalPeriod.textContent = `当前范围 ${activeRangeLabel()} · 尚未启用目标`;

    const goalStatus = document.querySelector("[data-goal-status]");
    if (goalStatus) goalStatus.innerHTML = pill("未设置目标", "orange");

    const goalProgressLabel = document.querySelector("[data-goal-progress-label]");
    if (goalProgressLabel) goalProgressLabel.innerHTML = "当前目标达成率 <span>0.00%</span> / 目标";

    const goalProgressValue = document.querySelector("[data-goal-progress-value]");
    if (goalProgressValue) goalProgressValue.innerHTML = `${formatCurrency(0)} / ${formatCurrency(0)}`;

    const goalProgressBar = document.querySelector("[data-goal-progress-bar]");
    if (goalProgressBar) goalProgressBar.style.width = "0%";

    const goalSummary = document.querySelector("[data-goal-summary]");
    if (goalSummary) {
      goalSummary.innerHTML = [
        ["目标月份", "—"],
        ["目标 GMV", formatCurrency(0)],
        ["当前月度能力", formatCurrency(0), "var(--green)"],
        ["目标差距", formatCurrency(0), "var(--red)"],
        [`${activeRangeLabel()} GMV`, formatCurrency(summary.gmv)],
      ]
        .map(
          ([label, value, color]) => `
            <div class="card pad">
              <div class="metric-label">${label}</div>
              <div class="metric-value" style="${color ? `color:${color}` : ""}">${value}</div>
            </div>
          `,
        )
        .join("");
    }

    const goalBreakdown = document.querySelector("[data-goal-breakdown]");
    if (goalBreakdown) {
      goalBreakdown.innerHTML = goalBreakdownPanel("目标拆解", "Target Breakdown", [
        ["达标所需日均 GMV", "Required Daily GMV", formatCurrency(0)],
        ["达标所需日均订单数", "Required Daily Orders", formatNumber(0)],
        ["达标所需月订单数", "Required Monthly Orders", formatInteger(0)],
        ["达标所需 Sessions", "Required Monthly Sessions", formatInteger(0)],
        ["当前 AOV", "Current AOV", formatCurrency(summary.aov)],
        ["当前 CVR", "Current CVR", `${formatNumber(data.ga4_funnel?.cvr)}%`],
      ]);
    }

    const currentCapability = document.querySelector("[data-current-capability]");
    if (currentCapability) {
      currentCapability.innerHTML = goalBreakdownPanel("当前能力评估", "Current Capability", [
        ["当前月度 GMV Run Rate", "Monthly GMV Run Rate", formatCurrency(0), "var(--green)"],
        ["当前月度订单 Run Rate", "Monthly Orders Run Rate", formatInteger(0)],
        ["当前月度 Sessions Run Rate", "Monthly Sessions Run Rate", formatInteger(0)],
        ["当前 CVR", "Current CVR", `${formatNumber(data.ga4_funnel?.cvr)}%`],
        ["当前 AOV", "Current AOV", formatCurrency(summary.aov)],
        ["预测月 GMV", "Forecast Month GMV", formatCurrency(0), "var(--green)"],
      ]);
    }

    const growthSimulator = document.querySelector("[data-growth-simulator]");
    if (growthSimulator) {
      growthSimulator.innerHTML = renderGrowthSimulator({
        id: "empty",
        start_date: data.range?.start || "",
        end_date: data.range?.end || "",
        target_gmv: 0,
        monthly_sessions_run_rate: 0,
        current_cvr: data.ga4_funnel?.cvr || 0,
        current_aov: summary.aov || 0,
        required_monthly_sessions: 0,
      });
    }
  }

  const northstarRevenue = document.querySelector("[data-northstar-revenue]");
  if (northstarRevenue) {
    northstarRevenue.innerHTML = section(
      "Revenue · 收入驱动",
      "销售额、订单与客单价",
      pill("Shopify"),
      `<div class="grid cols-4">
        ${metricCard("总销售额", formatCurrency(summary.gmv), cardDelta.gmv)}
        ${metricCard("订单数", formatInteger(summary.orders), cardDelta.orders)}
        ${metricCard("客单价", formatCurrency(summary.aov), cardDelta.aov)}
        ${metricCard("商品总额", formatCurrency(summary.gross_sales), cardDelta.gross_sales)}
        ${metricCard("退款额", formatCurrency(summary.refunds), cardDelta.refunds, "Shopify", spikySeries)}
      </div>`,
    );
  }

  const northstarTraffic = document.querySelector("[data-northstar-traffic]");
  if (northstarTraffic) {
    northstarTraffic.innerHTML = section(
      "Traffic · 流量效率",
      "获客质量与广告投放效率",
      `${pill("GA4")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`,
      `<div class="grid cols-4">
        ${metricCard("Sessions", formatInteger(data.ga4_funnel?.sessions), cardDelta.sessions, "GA4")}
        ${metricCard("广告花费", formatCurrency(adTotals.spend), cardDelta.spend, "Ads")}
        ${metricCard("CPC", formatCurrency(adTotals.cpc), cardDelta.cpc, "Ads")}
        ${metricCard("CPM", formatCurrency(adTotals.cpm), cardDelta.cpm, "Ads")}
      </div>`,
    );
  }

  const northstarConversion = document.querySelector("[data-northstar-conversion]");
  if (northstarConversion) {
    northstarConversion.innerHTML = section(
      "Conversion · 转化效率",
      "站点转化与支付完成",
      `${pill("Shopify")} ${pill("GA4")}`,
      `<div class="grid cols-4">
        ${metricCard("CVR", `${formatNumber(data.ga4_funnel?.cvr)}%`, cardDelta.cvr, "GA4")}
        ${metricCard("加购率", `${formatNumber(data.ga4_funnel?.add_to_cart_rate)}%`, cardDelta.add_to_cart_rate, "GA4")}
        ${metricCard("结账率", `${formatNumber(data.ga4_funnel?.checkout_rate)}%`, cardDelta.checkout_rate, "GA4")}
        ${metricCard("支付完成率", `${formatNumber(data.ga4_funnel?.payment_completion_rate)}%`, cardDelta.payment_completion_rate, "GA4")}
      </div>`,
    );
  }

  const northstarCustomer = document.querySelector("[data-northstar-customer]");
  if (northstarCustomer) {
    northstarCustomer.innerHTML = section(
      "Customer · 客户质量",
      "复购、LTV 与客户增长",
      pill("Shopify"),
      `<div class="grid cols-4">
        ${metricCard("新客销售额", formatCurrency(customerQuality.new_customer_revenue), cardDelta.new_customer_revenue)}
        ${metricCard("回头客销售额", formatCurrency(customerQuality.returning_customer_revenue), cardDelta.returning_customer_revenue)}
        ${metricCard("新客订单", formatInteger(customerQuality.new_customer_orders), cardDelta.new_customer_orders)}
        ${metricCard("回头客订单", formatInteger(customerQuality.returning_customer_orders), cardDelta.returning_customer_orders)}
        ${metricCard("复购率", `${formatNumber(customerQuality.repeat_rate)}%`, cardDelta.repeat_rate)}
      </div>`,
    );
  }

  const marketingOverview = document.querySelector("[data-marketing-overview]");
  if (marketingOverview) {
    marketingOverview.innerHTML = section(
      "营销概览",
      "广告平台与站内转化汇总",
      `${pill("Google Ads", "red")} ${pill("Meta Ads", "red")} ${pill("GA4")} ${pill("Shopify")}`,
      `<div class="grid cols-5">
        ${metricCard("广告花费", formatCurrency(adTotals.spend), cardDelta.spend, "Ads", metricSeries)}
        ${metricCard("销售额", formatCurrency(adTotals.revenue), compareDelta(adTotals.revenue, previousAdTotals.revenue), "Ads", trendSeries)}
        ${metricCard("ROAS", `${formatNumber(adTotals.roas)}x`, compareDelta(adTotals.roas, previousAdTotals.roas), "Ads", metricSeries)}
        ${metricCard("CPA", formatCurrency(adTotals.cpa), compareDelta(adTotals.cpa, previousAdTotals.cpa), "Ads", spikySeries)}
        ${metricCard("订单数", formatInteger(adTotals.purchases || summary.orders), compareDelta(adTotals.purchases || summary.orders, previousAdTotals.purchases || previousSummary.orders), "Shopify", metricSeries)}
      </div>`,
    );
  }

  const marketingChannelTable = document.querySelector("[data-marketing-channel-table]");
  if (marketingChannelTable) {
    marketingChannelTable.innerHTML = section(
      "渠道表现",
      "按渠道汇总广告表现与站内收入",
      `${pill("Ads", "red")} ${pill("Shopify")}`,
      tableCard(
        "",
        ["渠道", "花费", "销售额", "订单数", "客户数", "ROAS", "CPA", "CVR"],
        (channelMix.length ? channelMix : [{ channel: "暂无数据", spend: 0, revenue: 0, orders: 0, customers: 0, roas: 0, cpa: 0, cvr: 0 }]).map((row) => [
          escapeHtml(row.channel),
          formatCurrency(row.spend),
          formatCurrency(row.revenue),
          formatInteger(row.orders),
          formatInteger(row.customers),
          `${formatNumber(row.roas)}x`,
          formatCurrency(row.cpa),
          `${formatNumber(row.cvr)}%`,
        ]),
      ),
    );
  }

  const marketingFunnel = document.querySelector("[data-marketing-funnel]");
  if (marketingFunnel) {
    marketingFunnel.innerHTML = section(
      "营销漏斗",
      "Shopify + GA4 + 广告平台",
      `${pill("Shopify")} ${pill("GA4")} ${pill("Ads", "red")}`,
      `<div class="card pad">
        ${funnelSteps
          .map(
            (step) => `
              <div class="funnel-row">
                <b>${escapeHtml(step.label)}</b>
                <div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(step.width, 1)}%"></div></div>
                <b class="num">${formatInteger(step.value)}</b>
              </div>
            `,
          )
          .join("")}
      </div>`,
    );
  }

  const aarrrAcquisition = document.querySelector("[data-aarrr-acquisition]");
  if (aarrrAcquisition) {
    aarrrAcquisition.innerHTML = stage(
      "A",
      "Acquisition",
      "获取 · 流量与广告投放",
      `
        <div class="grid cols-3">
          ${metricCard("Sessions", formatInteger(data.ga4_funnel?.sessions), cardDelta.sessions, "GA4", metricSeries)}
          ${metricCard("Users", formatInteger(data.ga4_funnel?.users), compareDelta(data.ga4_funnel?.users, previousGa4Funnel.users), "GA4", trendSeries)}
          ${metricCard("广告花费", formatCurrency(adTotals.spend), cardDelta.spend, "Ads", spikySeries)}
          ${metricCard("CPC", formatCurrency(adTotals.cpc), cardDelta.cpc, "Ads", metricSeries)}
          ${metricCard("CPM", formatCurrency(adTotals.cpm), cardDelta.cpm, "Ads", metricSeries)}
        </div>
        <div class="grid cols-2" style="margin-top:18px">
          ${donutCard(
            "渠道来源占比",
            (channelMix.length ? channelMix : [{ channel: "Other", mix_share: 100 }])
              .slice(0, 6)
              .map((row) => [row.channel, row.mix_share || 0]),
            ["#00896b", "#49b994", "#6375d6", "#8999ea", "#f59e0b", "#a0aec0"],
          )}
          ${barChartCard(
            "获取链路",
            [
              ["广告曝光", adTotals.impressions],
              ["广告点击", adTotals.clicks],
              ["站内访问", data.ga4_funnel?.sessions || 0],
              ["新客", summary.customers || 0],
              ["订单", summary.orders || 0],
            ],
          )}
        </div>
      `,
      `${pill("GA4")} ${pill("Ads", "red")} ${pill("Shopify")}`,
    );
  }

  const aarrrActivation = document.querySelector("[data-aarrr-activation]");
  if (aarrrActivation) {
    aarrrActivation.innerHTML = stage(
      "A",
      "Activation",
      "激活 · 站内转化与落地页",
      `
        <div class="grid cols-3">
          ${metricCard("加购率", `${formatNumber(data.ga4_funnel?.add_to_cart_rate)}%`, cardDelta.add_to_cart_rate, "GA4", metricSeries)}
          ${metricCard("结账率", `${formatNumber(data.ga4_funnel?.checkout_rate)}%`, cardDelta.checkout_rate, "GA4", trendSeries)}
          ${metricCard("转化率", `${formatNumber(data.ga4_funnel?.cvr)}%`, cardDelta.cvr, "GA4", spikySeries)}
        </div>
        ${tableCard(
          "激活漏斗明细",
          ["阶段", "人数", "占会话比"],
          [
            ["Sessions", formatInteger(data.ga4_funnel?.sessions), "100.00%"],
            ["Add to carts", formatInteger(data.ga4_funnel?.add_to_carts), `${formatNumber(data.ga4_funnel?.add_to_cart_rate)}%`],
            ["Checkouts", formatInteger(data.ga4_funnel?.checkouts), `${formatNumber(data.ga4_funnel?.checkout_rate)}%`],
            ["Purchases", formatInteger(data.ga4_funnel?.purchases), `${formatNumber(data.ga4_funnel?.cvr)}%`],
          ],
        )}
      `,
      `${pill("GA4")} ${pill("Shopify")}`,
    );
  }

  const marketingAcquisition = document.querySelector("[data-marketing-acquisition]");
  if (marketingAcquisition) {
    const cac = customerQuality.new_customers ? adTotals.spend / customerQuality.new_customers : 0;
    marketingAcquisition.innerHTML = section(
      "获客分析",
      "新客/回头客及广告获客成本",
      `${pill("Shopify")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`,
      `<div class="grid cols-5">
        ${metricCard("新客户", formatInteger(customerQuality.new_customers), cardDelta.new_customers)}
        ${metricCard("回头客", formatInteger(customerQuality.returning_customers), cardDelta.returning_customers)}
        ${metricCard("广告获客成本", formatCurrency(cac), cardDelta.cac, "Ads")}
        ${metricCard("新客销售额", formatCurrency(customerQuality.new_customer_revenue), cardDelta.new_customer_revenue)}
        ${metricCard("回头客销售额", formatCurrency(customerQuality.returning_customer_revenue), cardDelta.returning_customer_revenue)}
      </div>`,
    );
  }

  const customersOverview = document.querySelector("[data-customers-overview]");
  if (customersOverview) {
    customersOverview.innerHTML = section(
      "用户概览",
      "店铺总客户数，为运营分群、复购指标分析提供基础",
      pill("Shopify"),
      `<div class="grid cols-5">
        ${metricCard("店铺总客户数", formatInteger(summary.customers), compareDelta(summary.customers, previousSummary.customers))}
        ${metricCard("新客户", formatInteger(customerQuality.new_customers), cardDelta.new_customers)}
        ${metricCard("回头客", formatInteger(customerQuality.returning_customers), cardDelta.returning_customers, "Shopify", spikySeries)}
        ${metricCard("复购率", `${formatNumber(customerQuality.repeat_rate)}%`, cardDelta.repeat_rate)}
        ${metricCard("新客销售额", formatCurrency(customerQuality.new_customer_revenue), cardDelta.new_customer_revenue)}
      </div>`,
    );
  }

  const customerDemographics = document.querySelector("[data-customer-demographics]");
  if (customerDemographics) {
    const insightHtml = renderPersonaInsights(data.audience?.overview || {}, data.shopify_persona || null);
    customerDemographics.innerHTML = section(
      "用户画像分析",
      "结合 GA4 与 Shopify 的核心用户特征",
      `${pill("GA4")} ${pill("Shopify")}`,
      insightHtml || personaEmptyState("当前暂无足够的用户画像数据"),
    );
  }

  const customerSegmentDistribution = document.querySelector("[data-customer-segment-distribution]");
  if (customerSegmentDistribution) {
    const rows = (data.customer_coupon_segments || []).map((row) => [`${row.category}客户`, number(row.percentage)]);
    customerSegmentDistribution.innerHTML = rows.length
      ? donutCard("客户分类分布", rows, ["#667085", "#f59e0b", "#00896b", "#3166d6", "#45bd9d"])
      : personaEmptyState("客户分类分布暂无真实数据");
  }

  const customersAcquisitionQuality = document.querySelector("[data-customers-acquisition-quality]");
  if (customersAcquisitionQuality) {
    const channelQuality = data.customer_channel_quality || [];
    const affiliateShare = (data.customer_coupon_segments || []).find((row) => row.category === "达人券")?.percentage || 0;
    const previousAffiliateShare = previousCustomerCouponSegments.find((row) => row.category === "达人券")?.percentage || 0;
    customersAcquisitionQuality.innerHTML = section(
      "获客质量",
      "按真实渠道客户数、渠道销售额与复购率评估获客质量",
      pill("Shopify"),
      `<div class="grid cols-3">
        ${metricCard("联盟客户占比", `${formatNumber(affiliateShare)}%`, compareDelta(affiliateShare, previousAffiliateShare))}
        ${barChartCard(
          "渠道客户数",
          channelQuality.map((row) => [normalizeChannelGroup(row.channel), number(row.customers)]),
        )}
        ${barChartCard(
          "渠道复购率",
          channelQuality.map((row) => [normalizeChannelGroup(row.channel), number(row.repeat_rate)]),
          "#45bd9d",
        )}
      </div>${tableCard(
        "渠道客户质量",
        ["渠道", "客户数", "复购客户", "复购率", "销售额"],
        channelQuality.map((row) => [
          escapeHtml(normalizeChannelGroup(row.channel)),
          formatInteger(row.customers),
          formatInteger(row.repeat_customers),
          `${formatNumber(row.repeat_rate)}%`,
          formatCurrency(row.revenue),
        ]),
      )}`,
    );
  }

  const customersValue = document.querySelector("[data-customers-value]");
  if (customersValue) {
    customersValue.innerHTML = section(
      "用户价值",
      "人均消费、购买频次、LTV 与回头客表现",
      pill("Shopify"),
      `<div class="grid cols-4">
        ${metricCard("人均消费", formatCurrency(customerQuality.avg_customer_value), cardDelta.avg_customer_value)}
        ${metricCard("LTV（生命周期价值）", formatCurrency(customerQuality.avg_customer_value), cardDelta.avg_customer_value)}
        ${metricCard("购买频次", formatNumber(customerQuality.purchase_frequency), cardDelta.purchase_frequency)}
        ${metricCard("回头客", formatInteger(customerQuality.returning_customers), cardDelta.returning_customers)}
      </div>${tableCard("高价值客户 Top", ["客户", "邮箱", "订单数", "销售额", "LTV", "最近下单"], customerValueRows)}`,
    );
  }

  const aarrrRevenue = document.querySelector("[data-aarrr-revenue]");
  if (aarrrRevenue) {
    aarrrRevenue.innerHTML = stage(
      "R",
      "Revenue",
      "收入 · 销售与优惠券",
      `<div class="grid cols-4">
        ${metricCard("商品总额", formatCurrency(summary.gross_sales), cardDelta.gross_sales)}
        ${metricCard("总销售额", formatCurrency(summary.gmv), cardDelta.gmv)}
        ${metricCard("订单数", formatInteger(summary.orders), cardDelta.orders)}
        ${metricCard("客单价", formatCurrency(summary.aov), cardDelta.aov)}
        ${metricCard("退款额", formatCurrency(summary.refunds), cardDelta.refunds, "Shopify", spikySeries)}
        ${metricCard("用券率", `${formatNumber(summary.coupon_order_rate)}%`, cardDelta.coupon_order_rate)}
      </div><div data-coupon-usage-breakdown>${tableCard(
        "优惠券类型分布",
        ["分类", "订单数", "销售额", "占比"],
        (data.coupon_usage || []).map((row) => [
          escapeHtml(row.category),
          formatInteger(row.orders),
          formatCurrency(row.revenue),
          `${formatNumber(row.order_share)}%`,
        ]),
      )}</div>`,
      pill("Shopify"),
    );
  }

  const aarrrRetention = document.querySelector("[data-aarrr-retention]");
  if (aarrrRetention) {
    aarrrRetention.innerHTML = stage(
      "R",
      "Retention",
      "留存 · 新老客与复购",
      `<div class="grid cols-5">
        ${metricCard("新客订单", formatInteger(customerQuality.new_customer_orders), cardDelta.new_customer_orders)}
        ${metricCard("回头客订单", formatInteger(customerQuality.returning_customer_orders), cardDelta.returning_customer_orders, "Shopify", spikySeries)}
        ${metricCard("新客销售额", formatCurrency(customerQuality.new_customer_revenue), cardDelta.new_customer_revenue)}
        ${metricCard("回头客销售额", formatCurrency(customerQuality.returning_customer_revenue), cardDelta.returning_customer_revenue, "Shopify", spikySeries)}
        ${metricCard("复购率", `${formatNumber(customerQuality.repeat_rate)}%`, cardDelta.repeat_rate)}
      </div>`,
      pill("Shopify"),
    );
  }

  const aarrrReferral = document.querySelector("[data-aarrr-referral]");
  if (aarrrReferral) {
    const referralRevenueSeries = (referral.daily || []).map((row) => number(row.revenue));
    const referralOrdersSeries = (referral.daily || []).map((row) => number(row.orders));
    aarrrReferral.innerHTML = stage(
      "R",
      "Referral",
      "推荐 · 联盟与达人导购",
      `<div class="grid cols-3">
        ${metricCard("联盟订单", formatInteger(referral.affiliate_orders), cardDelta.affiliate_orders, "Shopify", referralOrdersSeries)}
        ${metricCard("联盟销售额", formatCurrency(referral.affiliate_revenue), cardDelta.affiliate_revenue, "Shopify", referralRevenueSeries)}
        ${metricCard("联盟订单占比", `${formatNumber(referral.affiliate_order_share)}%`, cardDelta.affiliate_order_share, "Shopify", referralOrdersSeries)}
        ${metricCard("达人券订单", formatInteger(referral.influencer_coupon_orders), cardDelta.influencer_coupon_orders, "Shopify", referralOrdersSeries)}
        ${metricCard("达人券销售额", formatCurrency(referral.influencer_coupon_revenue), cardDelta.influencer_coupon_revenue, "Shopify", referralRevenueSeries)}
      </div>${tableCard(
        "联盟达人排行",
        ["#", "联盟/达人", "订单数", "销售额", "订单占比"],
        (referral.top_referrers || []).map((row, index) => [
          String(index + 1),
          escapeHtml(row.owner),
          formatInteger(row.orders),
          formatCurrency(row.revenue),
          `${formatNumber(row.order_share)}%`,
        ]),
      )}`,
      pill("Shopify"),
    );
  }

  applyRealSparklineSeries(data);
}

function applyRealSparklineSeries(data) {
  const seriesMap = buildSeriesMap(data);
  document.querySelectorAll(".sparkline-wrap[data-series-key]").forEach((node) => {
    const key = node.dataset.seriesKey;
    const series = seriesMap[key];
    if (series?.length) {
      setSparklineSeries(node, series);
      return;
    }
    if (!node.closest(".mock-card")) {
      setSparklineSeries(node, buildEmptyRangeSeries(data.range));
    }
  });
  initializeSparklineTooltips();
}

function buildEmptyRangeSeries(range) {
  const start = range?.start;
  const end = range?.end;
  if (!start || !end) return [{ label: "P1", value: 0 }, { label: "P2", value: 0 }];
  const rows = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  while (cursor <= endDate && rows.length < 120) {
    rows.push({ label: cursor.toISOString().slice(0, 10), value: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rows.length ? rows : [{ label: start, value: 0 }, { label: end, value: 0 }];
}

function buildSeriesMap(data) {
  const sales = data.daily_sales || [];
  const ga4 = data.ga4_daily || [];
  const ads = data.ad_daily || [];
  const customer = data.customer_daily || [];

  return {
    gmv: sales.map((row) => ({ label: row.day, value: row.gmv })),
    gross_sales: sales.map((row) => ({ label: row.day, value: row.gross_sales })),
    orders: sales.map((row) => ({ label: row.day, value: row.orders })),
    aov: sales.map((row) => ({ label: row.day, value: row.aov })),
    refunds: sales.map((row) => ({ label: row.day, value: row.refunds })),
    coupon_order_rate: sales.map((row) => ({ label: row.day, value: row.coupon_order_rate })),
    sessions: ga4.map((row) => ({ label: row.day, value: row.sessions })),
    users: ga4.map((row) => ({ label: row.day, value: row.users })),
    add_to_cart_rate: ga4.map((row) => ({ label: row.day, value: row.add_to_cart_rate })),
    checkout_rate: ga4.map((row) => ({ label: row.day, value: row.checkout_rate })),
    cvr: ga4.map((row) => ({ label: row.day, value: row.cvr })),
    payment_completion_rate: ga4.map((row) => ({ label: row.day, value: row.payment_completion_rate })),
    spend: ads.map((row) => ({ label: row.day, value: row.spend })),
    cpc: ads.map((row) => ({ label: row.day, value: row.cpc })),
    cpm: ads.map((row) => ({ label: row.day, value: row.cpm })),
    roas: ads.map((row) => ({ label: row.day, value: row.roas })),
    cpa: ads.map((row) => ({ label: row.day, value: row.cpa })),
    new_customer_revenue: customer.map((row) => ({ label: row.day, value: row.new_customer_revenue })),
    returning_customer_revenue: customer.map((row) => ({ label: row.day, value: row.returning_customer_revenue })),
    customers: customer.map((row) => ({ label: row.day, value: row.customers })),
    new_customers: customer.map((row) => ({ label: row.day, value: row.new_customer_orders })),
    returning_customers: customer.map((row) => ({ label: row.day, value: row.returning_customers })),
    new_customer_orders: customer.map((row) => ({ label: row.day, value: row.new_customer_orders })),
    returning_customer_orders: customer.map((row) => ({ label: row.day, value: row.returning_customer_orders })),
    avg_customer_value: customer.map((row) => ({ label: row.day, value: row.avg_customer_value })),
    purchase_frequency: customer.map((row) => ({ label: row.day, value: row.purchase_frequency })),
    repeat_rate: customer.map((row) => ({ label: row.day, value: row.repeat_rate })),
    cac: customer.map((row) => ({
      label: row.day,
      value: row.new_customer_orders ? (ads.find((ad) => ad.day === row.day)?.spend || 0) / row.new_customer_orders : 0,
    })),
  };
}

function setSparklineSeries(node, points) {
  const series = normalizeSparklineSeries(points);
  node.dataset.series = JSON.stringify(series);
  const svg = node.querySelector(".sparkline");
  if (!svg) return;
  const values = series.map((point) => Number(point.value || 0));
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const coords = values.map((p, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * 100;
    const y = 42 - ((p - min) / (max - min || 1)) * 34;
    return [x, y];
  });
  const line = smoothPath(coords);
  const fill = `${line} L100,46 L0,46 Z`;
  const fillPath = svg.querySelector(".fill");
  const linePath = svg.querySelector(".line");
  if (fillPath) fillPath.setAttribute("d", fill);
  if (linePath) linePath.setAttribute("d", line);
}

function normalizeSparklineSeries(points) {
  return points.map((point, index) =>
    typeof point === "number"
      ? { label: `P${index + 1}`, value: point }
      : { label: point.label || `P${index + 1}`, value: Number(point.value || 0) },
  );
}

function initializeSparklineTooltips() {
  document.querySelectorAll(".sparkline-wrap").forEach((node) => {
    if (node.dataset.tooltipBound === "1") return;
    node.dataset.tooltipBound = "1";
    node.addEventListener("mousemove", handleSparklineMove);
    node.addEventListener("mouseleave", handleSparklineLeave);
  });
}

function handleSparklineMove(event) {
  const wrapper = event.currentTarget;
  const tooltip = wrapper.querySelector(".sparkline-tooltip");
  const series = JSON.parse(wrapper.dataset.series || "[]");
  if (!tooltip || !series.length) return;

  const rect = wrapper.getBoundingClientRect();
  const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  const index = Math.min(series.length - 1, Math.round(ratio * Math.max(series.length - 1, 1)));
  const point = series[index];
  tooltip.innerHTML = `<strong>${escapeHtml(point.label)}</strong><span>${formatTooltipValue(point.value, wrapper.dataset.seriesKey)}</span>`;
  tooltip.style.opacity = "1";
  tooltip.style.left = `${Math.min(Math.max(ratio * rect.width, 58), rect.width - 58)}px`;
  tooltip.style.top = "4px";
}

function handleSparklineLeave(event) {
  const tooltip = event.currentTarget.querySelector(".sparkline-tooltip");
  if (tooltip) tooltip.style.opacity = "0";
}

function formatTooltipValue(value, key) {
  if (["gmv", "gross_sales", "aov", "refunds", "spend", "cpc", "cpm", "cpa", "new_customer_revenue", "returning_customer_revenue"].includes(key)) {
    return formatCurrency(value);
  }
  if (key === "roas") return `${formatNumber(value)}x`;
  if (["cvr", "add_to_cart_rate", "checkout_rate", "payment_completion_rate", "repeat_rate"].includes(key)) {
    return `${formatNumber(value)}%`;
  }
  if (["orders", "sessions", "users", "new_customer_orders", "returning_customer_orders"].includes(key)) {
    return formatInteger(value);
  }
  return formatNumber(value);
}

function buildAdTotals(rows) {
  const totals = rows.reduce(
    (result, row) => {
      result.spend += Number(row.spend || 0);
      result.revenue += Number(row.revenue || 0);
      result.impressions += Number(row.impressions || 0);
      result.clicks += Number(row.clicks || 0);
      result.purchases += Number(row.purchases || 0);
      return result;
    },
    { spend: 0, revenue: 0, impressions: 0, clicks: 0, purchases: 0 },
  );

  return {
    ...totals,
    roas: totals.spend ? totals.revenue / totals.spend : 0,
    cpa: totals.purchases ? totals.spend / totals.purchases : 0,
    cpc: totals.clicks ? totals.spend / totals.clicks : 0,
    cpm: totals.impressions ? (totals.spend / totals.impressions) * 1000 : 0,
  };
}

function buildChannelMix(channelRows, adRows) {
  const adMap = new Map();
  adRows.forEach((row) => {
    const key = normalizeChannel(row.source);
    adMap.set(key, {
      channel: row.source || "Unknown",
      spend: Number(row.spend || 0),
      revenue: Number(row.revenue || 0),
      orders: Number(row.purchases || 0),
      customers: Number(row.purchases || 0),
      roas: Number(row.roas || 0),
      cpa: Number(row.cpa || 0),
      cvr: Number(row.clicks ? (row.purchases / row.clicks) * 100 : 0),
    });
  });

  const rows = channelRows.map((row) => {
    const key = normalizeChannel(row.channel);
    const ad = adMap.get(key);
    return {
      channel: row.channel || ad?.channel || "Unknown",
      spend: Number(ad?.spend || 0),
      revenue: Number(row.revenue || ad?.revenue || 0),
      orders: Number(row.orders || ad?.orders || 0),
      customers: Number(row.customers || ad?.customers || 0),
      roas: Number(ad?.roas || (ad?.spend ? Number(row.revenue || 0) / ad.spend : 0)),
      cpa: Number(ad?.cpa || (ad?.orders ? (ad.spend || 0) / ad.orders : 0)),
      cvr: Number(ad?.cvr || (row.customers ? (row.orders / row.customers) * 100 : 0)),
    };
  });

  adMap.forEach((row, key) => {
    if (!rows.some((item) => normalizeChannel(item.channel) === key)) {
      rows.push({ ...row });
    }
  });

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0) || 1;
  return rows
    .map((row) => ({
      ...row,
      mix_share: (row.revenue / totalRevenue) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function buildFunnelSteps(ga4, adTotals, summary) {
  const steps = [
    { label: "曝光", value: adTotals.impressions },
    { label: "点击", value: adTotals.clicks },
    { label: "访问 Sessions", value: Number(ga4.sessions || 0) },
    { label: "加购", value: Number(ga4.add_to_carts || 0) },
    { label: "结账", value: Number(ga4.checkouts || 0) },
    { label: "购买", value: Number(ga4.purchases || summary.orders || 0) },
  ];
  const max = steps[0]?.value || 1;
  return steps.map((step) => ({
    ...step,
    width: max ? (step.value / max) * 100 : 0,
  }));
}

function normalizeChannel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
}

function compareDelta(current, previous) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0 && currentValue === 0) return "0.00%";
  if (previousValue === 0) return "+100.00%";
  const delta = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatNumber(delta)}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDateInputValue(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function initialOf(value) {
  return String(value || "C").trim().charAt(0).toUpperCase() || "C";
}

render();
