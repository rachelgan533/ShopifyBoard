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
