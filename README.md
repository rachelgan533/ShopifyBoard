# Shopify 数据看板系统搭建步骤

这个目录里已经写好了一个前台原型，可以直接部署到 Vercel。当前数据是 mock 数据，后续把 `app.js` 里的 mock 数据替换成 Supabase API 返回即可。

## 1. 技术架构

```text
Shopify GraphQL Admin API / Webhooks
        -> Vercel API Routes / Cron Jobs
        -> Supabase Postgres
        -> SQL View / RPC
        -> Vercel 前台数据看板
```

## 2. Supabase 建表

先在 Supabase SQL Editor 执行项目里的完整 SQL：

[supabase-schema.sql](/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/supabase-schema.sql)

里面包含建表、索引、触发器、RLS 开启和看板视图。下面是核心表的简化说明：

```sql
create table shops (
  id uuid primary key default gen_random_uuid(),
  shop_domain text unique not null,
  shop_name text,
  currency text default 'USD',
  timezone text,
  created_at timestamptz default now()
);

create table orders (
  id text primary key,
  shop_id uuid references shops(id),
  name text,
  created_at timestamptz,
  updated_at timestamptz,
  currency text,
  total_price numeric,
  subtotal_price numeric,
  total_tax numeric,
  total_discounts numeric,
  total_refunded numeric default 0,
  financial_status text,
  fulfillment_status text,
  customer_id text,
  customer_email text,
  customer_country text,
  customer_province text,
  customer_city text,
  source_name text,
  discount_codes text[],
  raw jsonb,
  synced_at timestamptz default now()
);

create table order_line_items (
  id text primary key,
  order_id text references orders(id),
  product_id text,
  variant_id text,
  sku text,
  title text,
  quantity int,
  price numeric,
  total_discount numeric default 0,
  raw jsonb
);

create table customers (
  id text primary key,
  shop_id uuid references shops(id),
  email text,
  first_order_at timestamptz,
  last_order_at timestamptz,
  orders_count int default 0,
  total_spent numeric default 0,
  country text,
  province text,
  city text,
  raw jsonb,
  synced_at timestamptz default now()
);

create table coupon_codes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  code text not null,
  category text,
  owner text,
  usage_count int default 0,
  status text default 'active',
  raw jsonb,
  created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id),
  name text not null,
  start_date date not null,
  end_date date not null,
  target_gmv numeric not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table sync_state (
  source text primary key,
  last_synced_at timestamptz,
  cursor text,
  status text default 'idle',
  updated_at timestamptz default now()
);
```

## 3. 建 SQL 视图

```sql
create view dashboard_daily_sales as
select
  date_trunc('day', created_at) as day,
  count(*) as orders,
  sum(total_price) as gmv,
  sum(total_price - coalesce(total_refunded, 0)) as net_sales,
  avg(total_price) as aov,
  sum(total_refunded) as refunds
from orders
group by 1
order by 1 desc;

create view dashboard_top_products as
select
  title,
  sku,
  sum(quantity) as units_sold,
  sum(quantity * price) as revenue
from order_line_items
group by title, sku
order by revenue desc;

create view dashboard_country_sales as
select
  customer_country as country,
  count(distinct customer_id) as customers,
  sum(total_price) as revenue,
  avg(total_price) as aov
from orders
group by customer_country
order by revenue desc;
```

## 行为分析扩展

如果你要继续做站内用户路径、行为漏斗和高意图信号识别，项目里已经补了一份行为分析设计和 SQL 基础结构：

- 设计文档：
  [docs/user-behavior-analytics-plan.md](/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/docs/user-behavior-analytics-plan.md)
- SQL：
  [supabase-sql-parts/06-user-behavior-analytics.sql](/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/supabase-sql-parts/06-user-behavior-analytics.sql)

如果你的 Supabase SQL Editor 一次只能跑 100 行，也可以改用拆分版本，按顺序执行：

- [supabase-sql-parts/06-user-behavior-analytics-01-tables.sql](/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/supabase-sql-parts/06-user-behavior-analytics-01-tables.sql)
- [supabase-sql-parts/06-user-behavior-analytics-02-views-a.sql](/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/supabase-sql-parts/06-user-behavior-analytics-02-views-a.sql)
- [supabase-sql-parts/06-user-behavior-analytics-03-views-b.sql](/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/supabase-sql-parts/06-user-behavior-analytics-03-views-b.sql)

这部分会新增：

- `behavior_event_definitions`
- `user_behavior_events`
- `dashboard_behavior_summary_30d`
- `dashboard_behavior_funnel_30d`
- `dashboard_behavior_page_performance_30d`
- `dashboard_behavior_channel_30d`

建议实施顺序：

1. 先建行为事件表
2. 再接 Shopify Pixel / GA4 事件
3. 再做用户行为分析看板

### 行为事件写入接口

项目现在提供了统一的行为事件写入入口：

```text
POST /api/behavior-events
```

建议在 Vercel 环境变量中配置：

```bash
BEHAVIOR_WRITE_KEY=一串给前端像素使用的写入密钥
```

请求支持：

- 单条事件
- 批量事件 `events: []`
- 通过 `shop_domain` 或 `shop_id` 指定店铺

示例：

```json
{
  "shop_domain": "your-store.myshopify.com",
  "events": [
    {
      "event_name": "page_view",
      "event_time": "2026-06-18T12:30:00.000Z",
      "session_id": "sess_001",
      "user_pseudo_id": "anon_001",
      "page_url": "/products/c16-3-in-1-multi-function-juicer",
      "page_type": "product",
      "channel_primary": "organic",
      "device_category": "mobile",
      "product_id": "gid://shopify/Product/1234567890"
    }
  ]
}
```

可以通过以下任一方式鉴权：

- `Authorization: Bearer <BEHAVIOR_WRITE_KEY>`
- `x-behavior-write-key: <BEHAVIOR_WRITE_KEY>`
- `CRON_SECRET`（调试/后台批量写入时）

## 4. Shopify 同步

项目里已经创建了 Vercel 服务端接口：

- `/api/sync/shopify-orders`：按 `updated_at` 增量拉 Shopify 订单并写入 Supabase。
- `/api/sync/status`：查看同步状态。

环境变量：

```bash
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2026-04
SHOPIFY_CLIENT_ID=xxx
SHOPIFY_CLIENT_SECRET=xxx

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

CRON_SECRET=xxx
```

### Shopify 后台准备

1. 进入 Shopify Admin。
2. 打开 **Settings -> Apps and sales channels -> Develop apps**。
3. 创建一个 Custom app。
4. 配置 Admin API scopes，第一版建议：
   - `read_orders`
   - `read_customers`
   - `read_products`
   - `read_inventory` 可选
   - 如果要同步历史 60 天以前订单，需要申请 Shopify 的 all orders 权限。
5. 安装 App。
6. 在 Dev Dashboard 的 Settings 页面复制 **Client ID** 和 **Client Secret**。

新的 Shopify Dev Dashboard 应用通常不会直接显示长期 Admin API access token。项目会使用 **Client Credentials Grant**，自动向 Shopify 请求 24 小时有效的 access token。

Shopify token 请求地址是：

```text
https://{shop}.myshopify.com/admin/oauth/access_token
```

Body 格式是 `application/x-www-form-urlencoded`：

```text
grant_type=client_credentials
client_id=你的 Client ID
client_secret=你的 Client Secret
```

### 在 Vercel 配环境变量

把 `.env.example` 里的变量填到 Vercel Project 的 Environment Variables：

```bash
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2026-04
SHOPIFY_CLIENT_ID=你的 Client ID
SHOPIFY_CLIENT_SECRET=你的 Client Secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-or-secret-key

CRON_SECRET=一串随机长密码
SHOPIFY_SYNC_START_DATE=2026-05-01T00:00:00.000Z
SHOPIFY_SYNC_PAGE_SIZE=50
SHOPIFY_SYNC_MAX_PAGES=4
```

### 手动同步

部署到 Vercel 后，在浏览器或接口工具里访问：

```text
https://你的域名.vercel.app/api/sync/shopify-orders?secret=你的CRON_SECRET
```

成功会返回类似：

```json
{
  "ok": true,
  "imported_orders": 50,
  "imported_line_items": 120,
  "has_more": true
}
```

如果 `has_more` 是 `true`，说明还有下一批数据，再访问一次即可继续同步。接口会记录 `sync_state.last_synced_at`，后续只同步更新过的订单。

查看状态：

```text
https://你的域名.vercel.app/api/sync/status
```

### 在 Supabase 检查

执行完同步后，在 Supabase Table Editor 检查：

- `shops`
- `orders`
- `order_line_items`
- `customers`
- `products`
- `sync_state`

也可以在 SQL Editor 里跑：

```sql
select count(*) from orders;
select * from dashboard_summary_30d;
select * from dashboard_top_products limit 20;
```

## 5. Vercel 定时同步

`vercel.json` 可以加：

```json
{
  "crons": [
    {
      "path": "/api/sync/shopify-orders",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Hobby 计划 Cron 只能每天运行一次；上面配置表示每天 UTC 01:00 自动同步一次。需要每小时或更高频同步时，升级 Pro，或先通过同步接口手动触发。

## 6. 前台接真实数据

项目已经新增真实数据接口：

```text
/api/dashboard/shopify
```

这个接口会读取 Supabase 里的这些视图/表：

```text
dashboard_summary_30d
dashboard_daily_sales
dashboard_top_products
dashboard_country_sales
sync_state
```

前台 `app.js` 会在页面加载后自动请求：

```js
fetch('/api/dashboard/shopify')
```

如果接口成功返回，页面会用真实 Shopify 数据覆盖关键 mock 指标；如果接口失败或本地静态预览没有 API runtime，则继续显示 mock 数据作为兜底。

### 在前台集成页保存配置

项目也新增了集成配置接口：

```text
/api/integrations
```

打开：

```text
https://你的域名.vercel.app/settings/integration
```

填写：

```text
管理密钥：Vercel 里的 CRON_SECRET
Store Domain：bohealthy.myshopify.com
Client ID：Shopify Dev Dashboard 的 Client ID
Client Secret：Shopify Dev Dashboard 的 Client Secret
```

然后点 **保存配置**。配置会写入 Supabase 的 `data_integrations` 表。后续 `/api/sync/shopify-orders` 会优先读取这里保存的 Shopify 配置；如果没有保存，才退回读取 Vercel 环境变量。

保存后点 **手动同步**，会触发：

```text
/api/sync/shopify-orders
```

同步成功后，前台会再次读取 `/api/dashboard/shopify` 并更新关键指标。

优惠券页的 **同步订单分类** 会触发：

```text
/api/sync/coupons
```

它会读取 `orders.discount_codes`，汇总写入 `coupon_codes`，然后页面会自动刷新券码列表与优惠券统计表。

部署到 Vercel 后，确认真实数据接口：

```text
https://你的域名.vercel.app/api/dashboard/shopify
```

如果返回：

```json
{
  "ok": true,
  "summary": {}
}
```

说明前台已经可以读取 Supabase。若 `summary` 全是 0，说明 Shopify 订单还没有同步进 Supabase，先运行：

```text
https://你的域名.vercel.app/api/sync/shopify-orders?secret=你的CRON_SECRET
```

## 7. 本地预览

```bash
node server.mjs
```

浏览器打开：

```text
http://localhost:4173
```
