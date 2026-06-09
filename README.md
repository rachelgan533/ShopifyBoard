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

## 4. Shopify 同步

项目里已经创建了 Vercel 服务端接口：

- `/api/sync/shopify-orders`：按 `updated_at` 增量拉 Shopify 订单并写入 Supabase。
- `/api/sync/status`：查看同步状态。

环境变量：

```bash
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx
SHOPIFY_API_VERSION=2026-04

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

SHOPIFY_WEBHOOK_SECRET=xxx
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
5. 安装 App，复制 Admin API access token。

### 在 Vercel 配环境变量

把 `.env.example` 里的变量填到 Vercel Project 的 Environment Variables：

```bash
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2026-04
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_or_token

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

当前前台在 `app.js` 中使用本地 mock 数据。后续改成：

```js
const res = await fetch('/api/dashboard/summary?range=30d')
const data = await res.json()
```

然后把页面中的 mock 数组替换为接口返回的数据。

## 7. 本地预览

```bash
node server.mjs
```

浏览器打开：

```text
http://localhost:4173
```
