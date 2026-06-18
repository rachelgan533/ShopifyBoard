create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  shop_domain text unique not null,
  shop_name text,
  currency text default 'USD',
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists data_integrations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source text not null,
  status text default 'disconnected',
  config jsonb default '{}'::jsonb,
  last_connected_at timestamptz,
  last_tested_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, source)
);

create table if not exists sync_state (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source text not null,
  resource text not null,
  last_synced_at timestamptz,
  cursor text,
  status text default 'idle',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, source, resource)
);

create table if not exists customers (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  first_order_at timestamptz,
  last_order_at timestamptz,
  orders_count int default 0,
  total_spent numeric default 0,
  country text,
  province text,
  city text,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  title text,
  handle text,
  vendor text,
  product_type text,
  status text,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  name text,
  created_at timestamptz,
  updated_at timestamptz,
  processed_at timestamptz,
  currency text default 'USD',
  total_price numeric default 0,
  subtotal_price numeric default 0,
  total_tax numeric default 0,
  total_discounts numeric default 0,
  total_refunded numeric default 0,
  financial_status text,
  fulfillment_status text,
  customer_id text references customers(id),
  customer_email text,
  customer_country text,
  customer_province text,
  customer_city text,
  source_name text,
  landing_site text,
  referring_site text,
  discount_codes text[] default '{}',
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now()
);

create table if not exists order_line_items (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  order_id text references orders(id) on delete cascade,
  product_id text references products(id),
  variant_id text,
  sku text,
  title text,
  variant_title text,
  quantity int default 0,
  price numeric default 0,
  total_discount numeric default 0,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists refunds (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  order_id text references orders(id) on delete cascade,
  created_at timestamptz,
  amount numeric default 0,
  currency text default 'USD',
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now()
);

create table if not exists coupon_codes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  code text not null,
  category text default '达人券',
  owner text,
  usage_count int default 0,
  status text default '启用',
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, code)
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  target_gmv numeric not null,
  status text default 'active',
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ga4_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  day date not null,
  sessions int default 0,
  users int default 0,
  add_to_carts int default 0,
  checkouts int default 0,
  purchases int default 0,
  device text,
  country text,
  city text,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, day, device, country, city)
);

create table if not exists ad_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source text not null,
  day date not null,
  campaign_id text,
  campaign_name text,
  spend numeric default 0,
  impressions int default 0,
  clicks int default 0,
  purchases int default 0,
  revenue numeric default 0,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, source, day, campaign_id)
);

create table if not exists audience_segments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source text not null,
  segment_type text not null,
  segment_name text not null,
  users int default 0,
  percentage numeric default 0,
  affinity numeric,
  day date default current_date,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, source, segment_type, segment_name, day)
);

create table if not exists search_console_metrics (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  site_url text not null,
  day date not null,
  dimension_type text not null,
  dimension_value text not null default 'all',
  clicks numeric default 0,
  impressions numeric default 0,
  ctr numeric default 0,
  position numeric default 0,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, site_url, day, dimension_type, dimension_value)
);

create table if not exists traffic_attribution_daily (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  day date not null,
  source_system text not null default 'ga4',
  channel_primary text not null,
  channel_secondary text,
  sessions int default 0,
  users int default 0,
  new_users int default 0,
  engaged_sessions int default 0,
  add_to_carts int default 0,
  checkouts int default 0,
  purchases int default 0,
  revenue numeric default 0,
  clicks int default 0,
  impressions int default 0,
  spend numeric default 0,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, day, source_system, channel_primary, channel_secondary)
);

create index if not exists idx_orders_shop_created_at on orders(shop_id, created_at desc);
create index if not exists idx_orders_shop_customer on orders(shop_id, customer_id);
create index if not exists idx_orders_country on orders(shop_id, customer_country);
create index if not exists idx_line_items_order on order_line_items(order_id);
create index if not exists idx_line_items_product on order_line_items(shop_id, product_id);
create index if not exists idx_customers_shop_email on customers(shop_id, email);
create index if not exists idx_coupons_shop_code on coupon_codes(shop_id, code);
create index if not exists idx_ga4_day on ga4_daily_metrics(shop_id, day desc);
create index if not exists idx_ads_day on ad_daily_metrics(shop_id, source, day desc);
create index if not exists idx_audience_segments on audience_segments(shop_id, source, segment_type, day desc);
create index if not exists idx_search_console_day on search_console_metrics(shop_id, day desc, dimension_type);
create index if not exists idx_traffic_attr_day on traffic_attribution_daily(shop_id, day desc, channel_primary);

drop trigger if exists trg_shops_updated_at on shops;
create trigger trg_shops_updated_at before update on shops
for each row execute function set_updated_at();

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at before update on customers
for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
for each row execute function set_updated_at();

drop trigger if exists trg_coupon_codes_updated_at on coupon_codes;
create trigger trg_coupon_codes_updated_at before update on coupon_codes
for each row execute function set_updated_at();

drop trigger if exists trg_goals_updated_at on goals;
create trigger trg_goals_updated_at before update on goals
for each row execute function set_updated_at();

drop trigger if exists trg_search_console_metrics_updated_at on search_console_metrics;
create trigger trg_search_console_metrics_updated_at before update on search_console_metrics
for each row execute function set_updated_at();

drop trigger if exists trg_traffic_attribution_daily_updated_at on traffic_attribution_daily;
create trigger trg_traffic_attribution_daily_updated_at before update on traffic_attribution_daily
for each row execute function set_updated_at();

create or replace view dashboard_daily_sales as
select
  shop_id,
  date_trunc('day', created_at)::date as day,
  count(*)::int as orders,
  count(distinct customer_id)::int as customers,
  coalesce(sum(total_price), 0) as gmv,
  coalesce(sum(total_price - coalesce(total_refunded, 0)), 0) as net_sales,
  coalesce(avg(total_price), 0) as aov,
  coalesce(sum(total_refunded), 0) as refunds,
  coalesce(sum(total_discounts), 0) as discounts
from orders
group by shop_id, date_trunc('day', created_at)::date;

create or replace view dashboard_summary_30d as
select
  shop_id,
  count(*)::int as orders,
  count(distinct customer_id)::int as customers,
  coalesce(sum(total_price), 0) as gmv,
  coalesce(sum(total_price - coalesce(total_refunded, 0)), 0) as net_sales,
  coalesce(avg(total_price), 0) as aov,
  coalesce(sum(total_refunded), 0) as refunds,
  case
    when coalesce(sum(total_price), 0) = 0 then 0
    else round((coalesce(sum(total_refunded), 0) / sum(total_price)) * 100, 2)
  end as refund_rate
from orders
where created_at >= now() - interval '30 days'
group by shop_id;

create or replace view dashboard_top_products as
select
  li.shop_id,
  li.product_id,
  li.title,
  li.sku,
  sum(li.quantity)::int as units_sold,
  coalesce(sum(li.quantity * li.price), 0) as revenue
from order_line_items li
join orders o on o.id = li.order_id
where o.created_at >= now() - interval '30 days'
group by li.shop_id, li.product_id, li.title, li.sku;

create or replace view dashboard_country_sales as
select
  shop_id,
  coalesce(customer_country, 'Unknown') as country,
  count(*)::int as orders,
  count(distinct customer_id)::int as customers,
  coalesce(sum(total_price), 0) as revenue,
  coalesce(avg(total_price), 0) as aov,
  round(
    count(*) * 100.0 / nullif(sum(count(*)) over (partition by shop_id), 0),
    2
  ) as order_share
from orders
where created_at >= now() - interval '30 days'
group by shop_id, coalesce(customer_country, 'Unknown');

create or replace view dashboard_customer_segments as
select
  shop_id,
  segment,
  count(*)::int as customers,
  coalesce(sum(total_spent), 0) as revenue,
  coalesce(avg(total_spent), 0) as avg_customer_value
from (
  select
    shop_id,
    total_spent,
    case
      when orders_count <= 1 then '单次购买'
      when orders_count >= 2 and total_spent < 500 then '复购客户'
      when total_spent >= 500 then '高价值客户'
      else '其他客户'
    end as segment
  from customers
) c
group by shop_id, segment;

create or replace view dashboard_coupon_usage as
select
  c.shop_id,
  c.category,
  count(distinct o.id)::int as orders,
  coalesce(sum(o.total_price), 0) as revenue,
  round(
    count(distinct o.id) * 100.0 / nullif(sum(count(distinct o.id)) over (partition by c.shop_id), 0),
    2
  ) as order_share
from coupon_codes c
left join orders o
  on o.shop_id = c.shop_id
  and c.code = any(o.discount_codes)
  and o.created_at >= now() - interval '30 days'
group by c.shop_id, c.category;

create or replace view dashboard_channel_sales as
select
  shop_id,
  coalesce(source_name, 'unknown') as channel,
  count(*)::int as orders,
  count(distinct customer_id)::int as customers,
  coalesce(sum(total_price), 0) as revenue,
  coalesce(avg(total_price), 0) as aov
from orders
where created_at >= now() - interval '30 days'
group by shop_id, coalesce(source_name, 'unknown');

create or replace view dashboard_ga4_funnel_30d as
select
  shop_id,
  coalesce(sum(sessions), 0)::int as sessions,
  coalesce(sum(users), 0)::int as users,
  coalesce(sum(add_to_carts), 0)::int as add_to_carts,
  coalesce(sum(checkouts), 0)::int as checkouts,
  coalesce(sum(purchases), 0)::int as purchases,
  round(coalesce(sum(add_to_carts), 0) * 100.0 / nullif(sum(sessions), 0), 2) as add_to_cart_rate,
  round(coalesce(sum(checkouts), 0) * 100.0 / nullif(sum(sessions), 0), 2) as checkout_rate,
  round(coalesce(sum(purchases), 0) * 100.0 / nullif(sum(sessions), 0), 2) as cvr
from ga4_daily_metrics
where day >= current_date - interval '30 days'
group by shop_id;

create or replace view dashboard_ad_performance_30d as
select
  shop_id,
  source,
  coalesce(sum(spend), 0) as spend,
  coalesce(sum(revenue), 0) as revenue,
  coalesce(sum(impressions), 0)::int as impressions,
  coalesce(sum(clicks), 0)::int as clicks,
  coalesce(sum(purchases), 0)::int as purchases,
  round(coalesce(sum(revenue), 0) / nullif(sum(spend), 0), 2) as roas,
  round(coalesce(sum(spend), 0) / nullif(sum(purchases), 0), 2) as cpa,
  round(coalesce(sum(clicks), 0) * 100.0 / nullif(sum(impressions), 0), 2) as ctr,
  round(coalesce(sum(spend), 0) / nullif(sum(clicks), 0), 2) as cpc
from ad_daily_metrics
where day >= current_date - interval '30 days'
group by shop_id, source;

create or replace view dashboard_persona_segments_latest as
select distinct on (shop_id, source, segment_type, segment_name)
  shop_id,
  source,
  segment_type,
  segment_name,
  users,
  percentage,
  affinity,
  day
from audience_segments
order by shop_id, source, segment_type, segment_name, day desc;

create or replace view dashboard_active_goals as
select
  g.*,
  coalesce(sum(o.total_price), 0) as current_gmv,
  round(coalesce(sum(o.total_price), 0) * 100.0 / nullif(g.target_gmv, 0), 2) as achievement_rate
from goals g
left join orders o
  on o.shop_id = g.shop_id
  and o.created_at::date between g.start_date and g.end_date
where g.is_active = true or g.status = 'active'
group by g.id;

alter table shops enable row level security;
alter table data_integrations enable row level security;
alter table sync_state enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_line_items enable row level security;
alter table refunds enable row level security;
alter table coupon_codes enable row level security;
alter table goals enable row level security;
alter table ga4_daily_metrics enable row level security;
alter table ad_daily_metrics enable row level security;
alter table audience_segments enable row level security;
