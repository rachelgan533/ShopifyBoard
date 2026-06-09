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
  range: "近 30 天",
  sourceTab: "总览",
  couponQuery: "",
  couponFilter: "all",
  dashboardData: null,
  couponsData: null,
  integrationSecret: "",
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
        ${topbar(title, kicker, page)}
        <div class="content">${content}</div>
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
          <div class="brand-title">Canoly</div>
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
        <div class="avatar">C</div>
      </div>
    </header>
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
    <div class="card metric-card">
      <div class="metric-head">
        <div>
          <div class="metric-label">${label}</div>
          <div class="metric-value" ${key ? `data-metric="${key}"` : ""}>${value}</div>
        </div>
        <div>
          ${pill(source)}
          <div class="delta ${down ? "down" : ""}" style="margin-top:18px">${down ? "↘" : "↗"} ${delta}</div>
        </div>
      </div>
      ${sparkline(series)}
      <div class="small-label">较上期</div>
    </div>
  `;
}

function metricKey(label) {
  return {
    总销售额: "gmv",
    订单数: "orders",
    客单价: "aov",
    退款额: "refunds",
    新客户: "customers",
    店铺总客户数: "customers",
  }[label];
}

function mockMetric(label, value, source = "Google Ads", series = [24, 24, 24, 24, 24, 24]) {
  return `
    <div class="card mock-card">
      <div class="mock-head"><span>MOCK DATA</span><span>演示数据</span></div>
      <div class="mock-tags"><span class="mock-tag">${source}</span><span class="mock-tag">Meta Ads</span></div>
      <div class="metric-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
        <div class="delta" style="float:right">↗ +0.00%</div>
        ${sparkline(series)}
        <div class="small-label">较上期</div>
      </div>
    </div>
  `;
}

function sparkline(points) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 42 - ((p - min) / (max - min || 1)) * 34;
    return [x, y];
  });
  const line = smoothPath(coords);
  const fill = `${line} L100,46 L0,46 Z`;
  return `
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
  const max = Math.max(...rows.map((r) => Number(r[1])));
  return `
    <div class="card pad chart-card">
      <div class="chart-title">${title}</div>
      <div class="bar-chart">
        ${rows
          .map(
            ([label, value]) => `
              <div class="bar-row">
                <span class="num">${label}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${(Number(value) / max) * 100}%; background:${color}"></div></div>
                <span class="muted">${value}</span>
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

function tableMarkup(headers, rows) {
  return `
    <div class="table-wrap">
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

function northstarPage() {
  return `
    <div class="card hero-goal">
      <div class="metric-head">
        <div>
          <div class="muted">增长目标 Growth Goal</div>
          <div class="goal-title">2026年9月 GMV百万计划</div>
          <div class="muted">目标周期 2026-09-01 → 2026-09-30 · 目标 GMV US$1,000,000.00</div>
          <div style="margin-top:12px">${pill("Shopify")} ${pill("GA4")}</div>
        </div>
        ${pill("严重偏离 Off Track", "red")}
      </div>
      <div style="margin-top:24px">
        <div class="metric-head muted"><span>当前月度能力 <span data-metric="achievement_rate">25.61%</span> / 目标</span><strong><span data-metric="gmv">US$256,140.00</span> / US$1,000,000.00</strong></div>
        <div class="progress" style="margin-top:8px"><span style="width:25.6%"></span></div>
      </div>
    </div>

    <div class="grid cols-5" style="margin:18px 0 28px">
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
      ${tableCard("目标拆解", ["指标", "当前值"], [
        ["达标所需日均 GMV", "US$33,333.00"],
        ["达标所需日均订单数", "179"],
        ["达标所需月订单数", "5,376"],
        ["达标所需 Sessions", "521,942"],
        ["当前 AOV", "US$186.02"],
        ["当前 CVR", "1.03%"],
      ])}
      ${tableCard("当前能力评估", ["指标", "当前值"], [
        ["当前月 GMV Run Rate", "US$256,140.00"],
        ["当前月度订单 Run Rate", "1,377"],
        ["当前月 Sessions Run Rate", "186,780"],
        ["当前 CVR", "1.03%"],
        ["当前 AOV", "US$186.02"],
        ["预测 2026年9月 GMV", "US$357,872.00"],
      ])}
    </div>

    <section class="section">
      <div class="card pad simulator">
        <div>
          <div class="section-title" style="font-size:18px">增长模拟器</div>
          ${[
            ["Sessions（月）", "186,780", "36%"],
            ["CVR", "1.03%", "18%"],
            ["AOV", "US$186.02", "36%"],
          ]
            .map(([label, value, pos]) => `<div class="slider-row"><b>${label}</b><div class="fake-slider" style="--pos:${pos}"></div><b>${value}</b></div>`)
            .join("")}
        </div>
        <div class="card pad" style="background:#f7f8fa">
          <div class="metric-label">模拟结果</div>
          <div class="metric-value">US$357,872.00</div>
          <div class="muted">Sessions × CVR × AOV</div>
          <div class="delta down" style="margin-top:24px">距离目标 US$642,128.00</div>
        </div>
      </div>
    </section>

    ${section("Revenue · 收入驱动", "销售额、订单与客单价", pill("Shopify"), `<div class="grid cols-4">
      ${metricCard("总销售额", "US$256,153.98", "-43.64%")}
      ${metricCard("订单数", "1,377", "-23.24%")}
      ${metricCard("客单价", "US$186.02", "-26.57%")}
      ${metricCard("商品总额", "US$296,429.28", "-72.68%")}
      ${metricCard("退款额", "US$978.96", "+63.11%", "Shopify", spikySeries)}
    </div>`)}

    ${section("Traffic · 流量效率", "获客质量与广告投放效率", `${pill("GA4")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`, `<div class="grid cols-4">
      ${metricCard("Sessions", "186,765", "-19.10%", "GA4")}
      ${mockMetric("广告花费", "US$49,197.00")}
      ${mockMetric("CPC", "1.00")}
      ${mockMetric("CPM", "7.00")}
    </div>`)}

    ${section("Conversion · 转化效率", "站点转化与支付完成", `${pill("Shopify")} ${pill("GA4")}`, `<div class="grid cols-4">
      ${metricCard("CVR", "1.03%", "-15.57%", "Shopify")}
      ${metricCard("加购率", "9.90%", "-22.45%", "GA4")}
      ${metricCard("结账率", "4.50%", "-32.62%", "GA4")}
      ${metricCard("支付完成率", "15.30%", "+32.18%", "GA4")}
    </div>`)}

    ${section("Customer · 客户质量", "复购、LTV 与客户增长", pill("Shopify"), `<div class="grid cols-4">
      ${metricCard("新客销售额", "US$247,427.04", "-22.41%")}
      ${metricCard("回头客销售额", "US$8,726.94", "-93.56%")}
      ${metricCard("新客订单", "1,304", "-24.93%")}
      ${metricCard("回头客订单", "73", "+28.07%")}
      ${metricCard("复购率", "5.30%", "+66.85%")}
    </div>`)}
  `;
}

function personasPage() {
  const activeSource = state.sourceTab;
  if (activeSource === "Shopify") return personasShopifyPage();
  if (activeSource !== "总览") return personasSourcePage(activeSource);

  return `
    <p class="intro">跨渠道人群画像分析：综合 GA4、Google Ads、Meta Ads 与 Shopify 客户数据，识别核心人群与价值分层。</p>
    ${sourceTabs(activeSource)}
    <div class="sync-bar">Last Sync Time: <strong>2026年6月9日 09:09</strong></div>
    ${section("人群属性", "综合各渠道汇总的人群性别与年龄结构", `${pill("GA4")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")} ${pill("Shopify")}`, `
      <div class="grid cols-2">
        ${donutCard("性别分布", [["Female", 59.8], ["Male", 40.2]])}
        ${barChartCard("年龄分布", [["35-44", 6600], ["25-34", 6100], ["45-54", 4700], ["55-64", 2900], ["18-24", 1400], ["65+", 1260]])}
      </div>
    `)}
    ${section("地区与设备", "跨渠道地区与设备分布", "", `
      <div class="grid cols-2">
        ${tableCard("地区分布", ["地区分布", "Users", "占比"], [
          ["United States (US)", "1,306", "95.89%"],
          ["United Kingdom (GB)", "35", "2.57%"],
          ["Canada (CA)", "8", "0.59%"],
          ["Germany (DE)", "6", "0.44%"],
          ["France (FR)", "3", "0.22%"],
          ["Australia (AU)", "2", "0.15%"],
          ["PT (PT)", "1", "0.07%"],
          ["NL (NL)", "1", "0.07%"],
        ])}
        ${donutCard("访问设备明细", [["Mobile", 91.79], ["Desktop", 6.59], ["Tablet", 1.63]], ["#00896b", "#19a186", "#64c3a8"])}
      </div>
    `)}
    ${section("兴趣标签", "", "", tableCard("兴趣标签", ["兴趣类别", "Affinity", "占比"], [
      ["News & Politics/Avid News Readers", "100.0", "5.72%"],
      ["Food & Dining/Cooking Enthusiasts/Aspiring Chefs", "92.5", "5.30%"],
      ["Shoppers/Shopping Enthusiasts", "89.7", "5.14%"],
      ["News & Politics/Avid News Readers/Entertainment News Enthusiasts", "87.4", "5.00%"],
      ["Lifestyles & Hobbies/Shutterbugs", "62.3", "3.56%"],
      ["Travel/Travel Buffs", "59.8", "3.43%"],
      ["Technology/Social Media Enthusiasts", "53.6", "3.07%"],
      ["Home & Garden/Home Decor Enthusiasts", "52.4", "3.00%"],
      ["Others", "1057.7", "60.50%"],
    ]))}
    ${section("客户价值画像", "", "", tableCard("客户价值画像", ["价值分层", "客户数", "销售额", "客单价", "占比"], [
      ["New", "1,292", "US$245,830.21", "US$190.27", "94.86%"],
      ["Champions", "19", "US$5,635.06", "US$296.58", "1.40%"],
      ["Loyal", "51", "US$4,688.71", "US$91.94", "3.74%"],
    ]))}
  `;
}

function personasSourcePage(source) {
  const isMock = source === "Google Ads" || source === "Meta Ads";
  return `
    <p class="intro">${source} 受众维度：Gender、Age、Interests、Language、Country/City、Device。</p>
    ${sourceTabs(source)}
    <div class="sync-bar">Last Sync Time: <strong>${isMock ? "等待授权同步" : "2026年6月8日 14:10"}</strong></div>
    ${section(`${source} ${isMock ? pill("演示数据", "orange") : pill(source === "GA4" ? "GA4" : source, source === "GA4" ? "" : "red")}`, isMock ? "连接广告账户后自动替换为真实受众数据" : "真实维度数据", "", `
      <div class="grid cols-2">
        ${donutCard("性别分布", [["Female", 59.8], ["Male", 40.2]])}
        ${barChartCard("年龄分布", [["35-44", 6600], ["25-34", 6100], ["45-54", 4700], ["55-64", 2900], ["18-24", 1400], ["65+", 1260]])}
      </div>
    `)}
    ${section("兴趣标签", "", "", tableCard("兴趣标签", ["兴趣类别", "Affinity", "占比"], [
      ["News & Politics/Avid News Readers", "100.0", "5.72%"],
      ["Food & Dining/Cooking Enthusiasts/Aspiring Chefs", "92.5", "5.30%"],
      ["Shoppers/Shopping Enthusiasts", "89.7", "5.14%"],
      ["Technology/Social Media Enthusiasts", "53.6", "3.07%"],
      ["Others", "1057.7", "60.50%"],
    ]))}
    <div class="grid cols-2">
      ${donutCard("Language", [["en-US", 90.64], ["en-GB", 2.36], ["en-CA", 1.58], ["de-DE", 0.79], ["Others", 4.63]], ["#00896b", "#19a186", "#6375d6", "#f59e0b", "#8e98aa"])}
      ${donutCard("访问设备明细", [["Mobile", 91.79], ["Desktop", 6.59], ["Tablet", 1.63]], ["#00896b", "#19a186", "#64c3a8"])}
    </div>
  `;
}

function personasShopifyPage() {
  return `
    <p class="intro">跨渠道人群画像分析：综合 GA4、Google Ads、Meta Ads 与 Shopify 客户数据，识别核心人群与价值分层。</p>
    ${sourceTabs("Shopify")}
    <div class="sync-bar">Last Sync Time: <strong>2026年6月9日 09:09</strong></div>
    ${section("Shopify", "Shopify 客户画像：Country/State/City、New vs Returning、AOV、LTV、Repeat Purchase Rate、Order Count", pill("Shopify"), `
      <div class="grid cols-3">
        ${tableCard("国家分布", ["地区分布", "Users", "占比"], [
          ["United States (US)", "1,306", "95.89%"],
          ["United Kingdom (GB)", "35", "2.57%"],
          ["Canada (CA)", "8", "0.59%"],
          ["Germany (DE)", "6", "0.44%"],
          ["France (FR)", "3", "0.22%"],
          ["Australia (AU)", "2", "0.15%"],
          ["Others", "2", "0.14%"],
        ])}
        ${tableCard("州/省分布", ["地区分布", "Users", "占比"], [
          ["纽约 (NY)", "126", "9.25%"],
          ["佛罗里达 (FL)", "126", "9.25%"],
          ["加利福尼亚 (CA)", "124", "9.10%"],
          ["德克萨斯 (TX)", "110", "8.08%"],
          ["佐治亚 (GA)", "94", "6.90%"],
          ["新泽西 (NJ)", "71", "5.21%"],
          ["Others", "449", "32.95%"],
        ])}
        ${tableCard("City", ["地区分布", "Users", "占比"], [
          ["Brooklyn (NY)", "27", "1.98%"],
          ["Chicago (IL)", "21", "1.54%"],
          ["Bronx (NY)", "20", "1.47%"],
          ["Houston (TX)", "17", "1.25%"],
          ["Atlanta (GA)", "15", "1.10%"],
          ["Others", "1,208", "86.61%"],
        ])}
      </div>
    `)}
    ${section("New vs Returning", "", "", donutCard("New vs Returning", [["New Customers", 94.9], ["Returning Customers", 5.1]]))}
    ${section("客户指标", "", "", `<div class="grid cols-4">
      ${metricCard("客单价", "US$186.02", "-26.57%")}
      ${metricCard("LTV（生命周期价值）", "US$76.58", "+0.00%")}
      ${metricCard("复购率", "5.30%", "+66.85%")}
      ${metricCard("订单数", "1,377", "-23.24%")}
    </div>`)}
  `;
}

function operationsPage() {
  return `
    <div class="grid cols-5">
      ${metricCard("总销售额", "US$42,783.80", "-8.69%")}
      ${metricCard("商品总额", "US$44,591.80", "-9.54%")}
      ${metricCard("订单数", "250", "-7.06%")}
      ${metricCard("客单价", "US$178.37", "-2.67%")}
      ${metricCard("退款额", "US$1,808.00", "+25.98%", "Shopify", spikySeries)}
    </div>
    ${section("弃购分析", "", "", `<div class="grid cols-4">
      <div class="card pad"><div class="metric-label">结账次数</div><div class="metric-value">810</div><div class="delta">↗ +8.50%</div></div>
      <div class="card pad"><div class="metric-label">弃购次数</div><div class="metric-value">769</div><div class="delta">↗ +1.70%</div></div>
      <div class="card pad"><div class="metric-label">弃购金额</div><div class="metric-value">US$102,271.20</div><div class="delta down">↘ -1.40%</div></div>
      <div class="card pad"><div class="metric-label">结账完成率</div><div class="metric-value">5.10%</div><div class="delta down">↘ -2.30%</div></div>
    </div>`)}
    <div class="grid cols-2">
      ${donutCard("订单类型", [["普通", 76.4], ["B2B", 23.6]], ["#00896b", "#6375d6"])}
      <div data-coupon-usage-summary>${tableCard("优惠券使用", ["分类", "订单数", "占比"], [
        ["未用券", "104", "41.60%"],
        ["新人券", "0", "0.00%"],
        ["活动券", "81", "32.40%"],
        ["达人券", "65", "26.00%"],
      ])}</div>
      ${barChartCard("转化漏斗", [["网站访客", 848991], ["进入购物车", 334182], ["点击支付", 112223], ["输入信用卡", 74917], ["购买成功", 54880]])}
      ${barChartCard("访问设备明细", [["手机", 460396], ["电脑", 280179], ["平板", 108416]], "#6375d6")}
    </div>
    ${section("销售趋势", "", "", `<div class="card pad">${sparkline(trendSeries)}${sparkline(trendSeries.slice().reverse())}</div>`)}
    <div class="grid cols-2">
      ${barChartCard("访客渠道来源", [["Instagram", 420000], ["邮件营销", 415000], ["Google", 360000], ["TikTok", 210000], ["联盟推广", 190000], ["Facebook", 110000], ["直播访问", 90000]])}
      ${barChartCard("渠道转化率", [["Facebook", 3.8], ["直接访问", 3.4], ["联盟推广", 2.1], ["TikTok", 1.8], ["Google", 1.1], ["邮件营销", 0.8], ["Instagram", 0.6]], "#8e98aa")}
    </div>
    ${section("商品销量排行", "", "", `<div data-top-products>${tableCard("", ["#", "商品", "销量", "销售额"], productRows.map((r, i) => [i + 1, ...r]))}</div>`)}
    ${section("美国各州销售分布", "仅统计美国市场订单", "", `<div class="card pad map-panel"><div class="us-map"></div><div>${miniRanks()}</div></div>`)}
  `;
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
    ${section("获客分析", "新客/回头客及广告获客成本", `${pill("Shopify")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`, `<div class="grid cols-5">
      ${metricCard("新客户", "1,304", "-24.93%")}
      ${metricCard("回头客", "73", "+28.07%")}
      ${mockMetric("CAC", "US$0.00")}
      ${metricCard("新客销售额", "US$247,427.04", "-22.42%")}
      ${metricCard("回头客销售额", "US$8,726.94", "-93.56%")}
    </div>`)}
    ${section("地域表现", "", `${pill("Shopify")} ${pill("Google Ads", "red")} ${pill("Meta Ads", "red")}`, `<div class="grid cols-2">
      ${barChartCard("国家销售额", countryRows.map((r) => [r[0], Number(r[2].replace(/[^0-9.]/g, ""))]))}
      ${mockMetric("区域 ROAS", "0.00")}
    </div>${tableCard("", ["地区", "销售额", "ROAS", "区域 CPA"], countryRows.map((r) => [r[0], r[2], "0.00x", "US$0.00"]))}`)}
  `;
}

function customersPage() {
  return `
    ${section("用户概览", "店铺总客户数，为运营分群、复购指标分析提供基础", pill("Shopify"), `<div class="grid cols-5">
      ${metricCard("店铺总客户数", "65,580", "+0.00%")}
      ${metricCard("新客户", "1,302", "-25.04%")}
      ${metricCard("回头客", "70", "+27.27%", "Shopify", spikySeries)}
      ${metricCard("复购率", "5.30%", "+66.85%")}
      ${metricCard("新客销售额", "US$247,427.04", "-22.41%")}
    </div>`)}
    <div class="grid cols-2">
      <div data-customer-segments>${tableCard("用户分群", ["分类", "客户数", "销售额", "占比"], [
        ["单次购买", "1,348", "US$252,365.26", "98.97%"],
        ["新客户", "1,302", "US$248,941.71", "95.59%"],
        ["用券客户", "1,086", "US$209,449.55", "79.74%"],
        ["联盟客户", "417", "US$79,240.18", "30.62%"],
        ["高价值客户", "396", "US$92,779.76", "29.07%"],
        ["复购客户", "70", "US$10,323.77", "5.14%"],
      ])}</div>
      ${donutCard("客户分类分布", [["未用券客户", 20.26], ["新人券客户", 2.35], ["站内活动券客户", 42.88], ["达人券客户", 34.51]], ["#667085", "#f59e0b", "#00896b", "#3166d6"])}
    </div>
    ${section("地域分布", "", pill("Shopify"), `<div class="grid cols-2">
      ${barChartCard("区域销售额", countryRows.map((r) => [r[0], Number(r[2].replace(/[^0-9.]/g, ""))]))}
      ${barChartCard("区域客单价", countryRows.map((r) => [r[0], Number(r[3].replace(/[^0-9.]/g, ""))]), "#6375d6")}
    </div><div data-country-sales>${tableCard("国家分布", ["地区", "客户数", "销售额", "客单价", "占比"], countryRows)}</div>`)}
    ${section("获客质量", "", pill("Shopify"), `<div class="grid cols-3">
      ${metricCard("联盟客户占比", "30.60%", "-31.68%")}
      ${barChartCard("渠道客户数", [["Google", 461], ["直接访问", 428], ["Facebook", 253], ["Instagram", 154], ["其他", 43], ["Organic Search", 23]])}
      ${barChartCard("渠道复购率", [["Google", 6.61], ["直接访问", 6.0], ["Facebook", 2.36], ["Instagram", 3.9], ["其他", 6.82], ["Organic Search", 4.35]], "#45bd9d")}
    </div>`)}
    ${section("用户价值", "人均消费、购买频次、LTV 与二次购买间隔", pill("Shopify"), `<div class="grid cols-4">
      ${metricCard("人均消费", "US$188.07", "-26.22%")}
      ${metricCard("LTV（生命周期价值）", "US$76.58", "+0.00%")}
      ${metricCard("购买频次", "1.01", "+0.48%")}
      ${metricCard("二次购买间隔（天）", "—", "-66.67%")}
    </div>${tableCard("高价值客户 Top", ["客户", "邮箱", "订单数", "销售额", "LTV", "最近下单"], customerValueRows)}`)}
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
    ${stage("R", "Revenue", "收入 · 销售与优惠券", `<div class="grid cols-4">
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
    ])}</div>`)}
    ${stage("R", "Retention", "留存 · 新老客与复购", `<div class="grid cols-5">
      ${metricCard("新客订单", "1,304", "-24.93%")}
      ${metricCard("回头客订单", "73", "+28.07%", "Shopify", spikySeries)}
      ${metricCard("新客销售额", "US$247,427.04", "-22.43%")}
      ${metricCard("回头客销售额", "US$8,726.94", "-93.56%", "Shopify", spikySeries)}
      ${metricCard("复购率", "5.30%", "+66.67%")}
    </div>`)}
    ${stage("R", "Referral", "推荐 · 联盟与达人导购", `<div class="grid cols-3">
      ${metricCard("联盟订单", "418", "-47.82%")}
      ${metricCard("联盟销售额", "US$79,166.29", "-43.53%")}
      ${metricCard("联盟订单占比", "30.40%", "-32.00%")}
      ${metricCard("达人券订单", "474", "-40.90%")}
      ${metricCard("达人券销售额", "US$89,006.36", "-36.51%")}
    </div>${tableCard("联盟达人排行", ["#", "联盟/达人", "订单数", "销售额", "订单占比"], [
      ["1", "JGARCIAS", "124", "US$23,640.75", "9.01%"],
      ["2", "GROW", "103", "US$19,497.55", "7.48%"],
      ["3", "META15", "34", "US$6,592.69", "2.47%"],
      ["4", "MICHELLE15", "33", "US$6,370.97", "2.40%"],
      ["5", "HERO", "33", "US$6,200.77", "2.40%"],
    ])}`)}
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
      <div class="metric-head">
        <div>
          <div class="goal-title">2026年9月 GMV百万计划</div>
          <div class="muted">2026-09-01 → 2026-09-30 · 目标 GMV US$1,000,000.00</div>
          <p class="muted">9月至季冲刺单月 GMV $1M</p>
        </div>
        <div class="button-row"><button class="ghost-btn" data-action="edit-goal">✎ 编辑目标</button><button class="ghost-btn" data-action="pause-goal">停用</button></div>
      </div>
    </div>
    ${section("目标列表", "长期维护经营目标，同一时间仅允许一个 Active Goal", "", tableCard("", ["目标名称", "开始日期", "结束日期", "Target GMV", "状态", "当前达成率", "操作"], [
      ["2026年Q4 增长目标", "2026-10-01", "2026-12-31", "US$2,500,000.00", '<span class="status gray">已停用</span>', "80.38%", "启用  ✎  🗑"],
      ["• 2026年9月 GMV百万计划", "2026-09-01", "2026-09-30", "US$1,000,000.00", '<span class="status gray">未开始</span>', "—", "停用  ✎  🗑"],
      ["2026年6月 增长目标", "2026-06-01", "2026-06-30", "US$300,000.00", '<span class="status">已完成</span>', "108.33%", "✎  🗑"],
    ]))}
    ${section("历史目标", "已结算与进行中的目标达成情况", "", `<div class="grid cols-2">
      <div class="card pad"><div class="metric-head"><div><div class="section-title">2026年9月 GMV百万计划</div><div class="muted">2026-09-01 → 2026-09-30</div></div><span class="status">进行中</span></div><div class="placeholder-line"></div><div class="metric-head"><span class="muted">目标</span><div class="metric-value">US$1,000,000.00</div></div></div>
      <div class="card pad"><div class="metric-head"><div><div class="section-title">2026年6月增长目标</div><div class="muted">2026-06-01 → 2026-06-30</div></div><span class="status">已完成</span></div><div class="placeholder-line"></div><div class="metric-head"><span class="muted">当前达成率</span><div class="metric-value" style="color:var(--green)">108.33%</div></div></div>
    </div>`)}
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
        ["sync_interval", "同步频率", "30"],
      ],
    },
    {
      source: "google_ads",
      icon: "A",
      title: "Google Ads",
      subtitle: "Google Ads · OAuth",
      status: "未连接",
      fields: [
        ["oauth_client_id", "Google OAuth Client ID", ""],
        ["customer_id", "Customer ID · 广告账号 ID", ""],
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
      <div class="card pad"><div class="muted">集成总数</div><div class="metric-value">4</div></div>
      <div class="card pad"><div class="muted">已连接</div><div class="metric-value" style="color:var(--green)">2</div></div>
      <div class="card pad"><div class="muted">连接异常</div><div class="metric-value" style="color:var(--red)">0</div></div>
    </div>
    <div class="card pad" style="max-width:900px;margin:0 auto 24px">
      <div class="field">
        <label>管理密钥 · 填 Vercel 中的 CRON_SECRET 后才能保存/同步</label>
        <input data-integration-secret type="password" value="${state.integrationSecret}" placeholder="请输入 CRON_SECRET" />
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
                <span class="status ${status === "未连接" ? "gray" : ""}">${status}</span>
              </div>
              <div class="placeholder-line"></div>
              <div class="form-grid">
                ${fields.map(([key, label, value]) => `<div class="field"><label>${label}</label><input data-config-key="${key}" value="${value}" ${/secret|token/i.test(key) ? 'type="password"' : ""} /></div>`).join("")}
              </div>
              <div class="button-row">
                <button class="ghost-btn" data-action="disconnect-source">断开连接</button>
                <button class="ghost-btn" data-action="save-source" data-source="${source}">保存配置</button>
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

function miniRanks() {
  return `
    <div class="mini-list">
      ${[
        ["佛罗里达", "US$24,605.22"],
        ["纽约", "US$23,985.05"],
        ["加利福尼亚", "US$23,928.76"],
        ["德克萨斯", "US$19,258.29"],
        ["佐治亚", "US$17,628.89"],
        ["新泽西", "US$13,536.94"],
      ]
        .map((r, i) => `<div class="mini-rank"><b>${i + 1}</b><span>${r[0]}</span><strong>${r[1]}</strong></div>`)
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
  if (page === "integration") loadIntegrationConfigs();
  if (page === "coupons") loadCoupons();
  hydrateDashboardData();
}

app.addEventListener("click", (event) => {
  const pathButton = event.target.closest("[data-path]");
  if (pathButton) {
    navigate(pathButton.dataset.path);
    return;
  }

  const rangeButton = event.target.closest("[data-range]");
  if (rangeButton) {
    state.range = rangeButton.dataset.range;
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

async function handleAction(action, button) {
  if (action === "save-source") {
    await saveIntegration(button);
    return;
  }

  if (action === "test-source") {
    await saveIntegration(button);
    if (button?.dataset.source === "shopify") await runShopifySync();
    return;
  }

  if (action === "manual-sync") {
    if (button?.dataset.source === "shopify") {
      await runShopifySync();
    } else {
      showToast("这个数据源的同步接口还没接入，当前只接通 Shopify。");
    }
    return;
  }

  if (action === "sync-coupons") {
    await syncCoupons();
    return;
  }

  if (action === "disconnect-source") {
    await disconnectSource(button);
    return;
  }

  const messages = {
    logout: "这是演示前台，真实登录退出需要接 Supabase Auth。",
    notifications: "暂无新通知。",
    "new-goal": "已打开新增目标入口；接 Supabase 后可保存到 goals 表。",
    "edit-goal": "已进入目标编辑状态；下一步可接弹窗表单。",
    "pause-goal": "已模拟停用当前目标。",
    "sync-coupons": "已模拟同步订单分类；真实环境会触发 Vercel API。",
    "new-coupon": "已打开新增券码入口；接 Shopify 后可同步 Price Rule。",
    "edit-coupon": "已进入券码编辑状态。",
    "delete-coupon": "已模拟删除券码；真实环境会二次确认。",
    "disconnect-source": "已模拟断开连接。",
    "save-source": "配置已模拟保存。",
    "test-source": "连接测试已模拟通过。",
    "manual-sync": "已模拟触发手动同步任务。",
  };
  showToast(messages[action] || "操作已触发。");
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
      body: JSON.stringify({ source, config, status: "connected" }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "保存失败");
    showToast(`${sourceLabel(source)} 配置已保存到 Supabase。`);
    loadIntegrationConfigs();
  } catch (error) {
    showToast(`保存失败：${error.message}`);
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
      body: JSON.stringify({ source, status: "disconnected", config: {} }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "断开失败");
    showToast(`${sourceLabel(source)} 已断开。`);
    loadIntegrationConfigs();
  } catch (error) {
    showToast(`断开失败：${error.message}`);
  }
}

async function runShopifySync() {
  if (!state.integrationSecret) return showToast("请先填写管理密钥 CRON_SECRET。");

  showToast("正在触发 Shopify 同步...");
  try {
    const response = await fetch(`/api/sync/shopify-orders?secret=${encodeURIComponent(state.integrationSecret)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "同步失败");
    state.dashboardData = null;
    await hydrateDashboardData();
    showToast(`Shopify 同步完成：订单 ${data.imported_orders}，明细 ${data.imported_line_items}`);
  } catch (error) {
    showToast(`同步失败：${error.message}`);
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

async function loadIntegrationConfigs() {
  try {
    const response = await fetch("/api/integrations");
    if (!response.ok) return;
    const data = await response.json();
    if (!data.ok) return;

    for (const item of data.integrations || []) {
      const card = document.querySelector(`[data-integration-card="${item.source}"]`);
      if (!card) continue;
      for (const [key, value] of Object.entries(item.config || {})) {
        const input = card.querySelector(`[data-config-key="${key}"]`);
        if (input) input.value = value;
      }
      const status = card.querySelector(".status");
      if (status) {
        status.textContent = item.status === "connected" ? "已保存" : item.status || "未连接";
        status.classList.toggle("gray", item.status !== "connected");
      }
    }
  } catch {
    // Keep form defaults when API is unavailable.
  }
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
  if (state.dashboardData) {
    applyDashboardData(state.dashboardData);
    return;
  }

  try {
    const response = await fetch("/api/dashboard/shopify");
    if (!response.ok) return;
    const data = await response.json();
    if (!data.ok) return;
    state.dashboardData = data;
    applyDashboardData(data);
  } catch {
    // Keep mock data visible when the local static preview has no API runtime.
  }
}

function applyDashboardData(data) {
  const summary = data.summary || {};
  const adTotals = buildAdTotals(data.ad_performance || []);
  const channelMix = buildChannelMix(data.channel_sales || [], data.ad_performance || []);
  const funnelSteps = buildFunnelSteps(data.ga4_funnel || {}, adTotals, summary);
  const values = {
    gmv: formatCurrency(summary.gmv),
    net_sales: formatCurrency(summary.net_sales),
    orders: formatInteger(summary.orders),
    customers: formatInteger(summary.customers),
    aov: formatCurrency(summary.aov),
    refunds: formatCurrency(summary.refunds),
    refund_rate: `${formatNumber(summary.refund_rate)}%`,
    achievement_rate: `${formatNumber((summary.gmv / 1000000) * 100)}%`,
  };

  document.querySelectorAll("[data-metric]").forEach((node) => {
    const value = values[node.dataset.metric];
    if (value !== undefined) node.textContent = value;
  });

  const progress = document.querySelector(".progress > span");
  if (progress && summary.gmv !== undefined) {
    progress.style.width = `${Math.max(0, Math.min(100, (summary.gmv / 1000000) * 100))}%`;
  }

  const syncBar = document.querySelector(".sync-bar");
  if (syncBar && data.sync?.last_synced_at) {
    syncBar.innerHTML = `Last Sync Time: <strong>${formatDateTime(data.sync.last_synced_at)}</strong>`;
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

  const marketingOverview = document.querySelector("[data-marketing-overview]");
  if (marketingOverview && (data.ad_performance?.length || data.ga4_funnel?.sessions)) {
    marketingOverview.innerHTML = section(
      "营销概览",
      "广告平台与站内转化汇总",
      `${pill("Google Ads", "red")} ${pill("Meta Ads", "red")} ${pill("GA4")} ${pill("Shopify")}`,
      `<div class="grid cols-5">
        ${metricCard("广告花费", formatCurrency(adTotals.spend), adTotals.spend ? "+0.00%" : "0.00%", "Ads", metricSeries)}
        ${metricCard("销售额", formatCurrency(adTotals.revenue), adTotals.revenue ? "+0.00%" : "0.00%", "Ads", trendSeries)}
        ${metricCard("ROAS", `${formatNumber(adTotals.roas)}x`, adTotals.roas ? "+0.00%" : "0.00%", "Ads", metricSeries)}
        ${metricCard("CPA", formatCurrency(adTotals.cpa), adTotals.purchases ? "+0.00%" : "0.00%", "Ads", spikySeries)}
        ${metricCard("订单数", formatInteger(adTotals.purchases || summary.orders), summary.orders ? "+0.00%" : "0.00%", "Shopify", metricSeries)}
      </div>`,
    );
  }

  const marketingChannelTable = document.querySelector("[data-marketing-channel-table]");
  if (marketingChannelTable && channelMix.length) {
    marketingChannelTable.innerHTML = section(
      "渠道表现",
      "按渠道汇总广告表现与站内收入",
      `${pill("Ads", "red")} ${pill("Shopify")}`,
      tableCard(
        "",
        ["渠道", "花费", "销售额", "订单数", "客户数", "ROAS", "CPA", "CVR"],
        channelMix.map((row) => [
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
  if (marketingFunnel && funnelSteps.length) {
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
  if (aarrrAcquisition && (data.ga4_funnel?.sessions || data.ad_performance?.length || channelMix.length)) {
    aarrrAcquisition.innerHTML = stage(
      "A",
      "Acquisition",
      "获取 · 流量与广告投放",
      `
        <div class="grid cols-3">
          ${metricCard("Sessions", formatInteger(data.ga4_funnel?.sessions), data.ga4_funnel?.sessions ? "+0.00%" : "0.00%", "GA4", metricSeries)}
          ${metricCard("Users", formatInteger(data.ga4_funnel?.users), data.ga4_funnel?.users ? "+0.00%" : "0.00%", "GA4", trendSeries)}
          ${metricCard("广告花费", formatCurrency(adTotals.spend), adTotals.spend ? "+0.00%" : "0.00%", "Ads", spikySeries)}
          ${metricCard("CPC", formatCurrency(adTotals.cpc), adTotals.clicks ? "+0.00%" : "0.00%", "Ads", metricSeries)}
          ${metricCard("CPM", formatCurrency(adTotals.cpm), adTotals.impressions ? "+0.00%" : "0.00%", "Ads", metricSeries)}
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
  if (aarrrActivation && (data.ga4_funnel?.sessions || data.ga4_funnel?.add_to_carts || data.ga4_funnel?.purchases)) {
    aarrrActivation.innerHTML = stage(
      "A",
      "Activation",
      "激活 · 站内转化与落地页",
      `
        <div class="grid cols-3">
          ${metricCard("加购率", `${formatNumber(data.ga4_funnel?.add_to_cart_rate)}%`, data.ga4_funnel?.add_to_carts ? "+0.00%" : "0.00%", "GA4", metricSeries)}
          ${metricCard("结账率", `${formatNumber(data.ga4_funnel?.checkout_rate)}%`, data.ga4_funnel?.checkouts ? "+0.00%" : "0.00%", "GA4", trendSeries)}
          ${metricCard("转化率", `${formatNumber(data.ga4_funnel?.cvr)}%`, data.ga4_funnel?.purchases ? "+0.00%" : "0.00%", "GA4", spikySeries)}
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
