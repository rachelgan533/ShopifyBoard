create table if not exists behavior_event_definitions (
  id uuid primary key default gen_random_uuid(),
  event_name text not null unique,
  category text not null,
  stage text not null,
  page_scope text,
  description text,
  required_params text[] default '{}'::text[],
  recommended_params text[] default '{}'::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_behavior_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  event_time timestamptz not null,
  event_name text not null,
  session_id text,
  user_pseudo_id text,
  customer_id text,
  page_url text,
  page_type text,
  referrer text,
  channel_primary text,
  device_category text,
  country text,
  city text,
  product_id text,
  variant_id text,
  collection_id text,
  search_term text,
  value numeric default 0,
  currency text default 'USD',
  properties jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_behavior_events_shop_time
  on user_behavior_events(shop_id, event_time desc);

create index if not exists idx_behavior_events_session
  on user_behavior_events(shop_id, session_id, event_time);

create index if not exists idx_behavior_events_event_name
  on user_behavior_events(shop_id, event_name, event_time desc);

create index if not exists idx_behavior_events_page_type
  on user_behavior_events(shop_id, page_type, event_time desc);

drop trigger if exists trg_behavior_event_definitions_updated_at on behavior_event_definitions;
create trigger trg_behavior_event_definitions_updated_at
before update on behavior_event_definitions
for each row execute function set_updated_at();

drop trigger if exists trg_user_behavior_events_updated_at on user_behavior_events;
create trigger trg_user_behavior_events_updated_at
before update on user_behavior_events
for each row execute function set_updated_at();

insert into behavior_event_definitions (
  event_name,
  category,
  stage,
  page_scope,
  description,
  required_params,
  recommended_params
)
values
  ('page_view', 'navigation', 'awareness', 'all', '基础页面浏览事件', array['page_url'], array['page_type', 'referrer']),
  ('view_item_list', 'commerce', 'consideration', 'collection', '浏览商品列表', array['collection_id'], array['page_url']),
  ('view_item', 'commerce', 'consideration', 'product', '浏览商品详情页', array['product_id'], array['variant_id', 'page_url']),
  ('add_to_cart', 'commerce', 'intent', 'product', '加入购物车', array['product_id'], array['variant_id', 'value', 'currency']),
  ('view_cart', 'commerce', 'intent', 'cart', '查看购物车', array[]::text[], array['value', 'currency']),
  ('begin_checkout', 'commerce', 'checkout', 'checkout', '开始结账', array[]::text[], array['value', 'currency']),
  ('purchase', 'commerce', 'purchase', 'checkout', '完成购买', array[]::text[], array['value', 'currency']),
  ('site_search', 'discovery', 'consideration', 'search', '站内搜索', array['search_term'], array['page_url']),
  ('filter_applied', 'discovery', 'consideration', 'collection', '使用筛选器', array[]::text[], array['page_url']),
  ('review_opened', 'content', 'consideration', 'product', '打开评价区块', array['product_id'], array['page_url']),
  ('variant_selected', 'interaction', 'consideration', 'product', '切换商品变体', array['product_id'], array['variant_id']),
  ('faq_opened', 'content', 'consideration', 'product', '打开 FAQ 区块', array['product_id'], array['page_url']),
  ('shipping_info_opened', 'content', 'consideration', 'product', '打开配送信息', array['product_id'], array['page_url']),
  ('coupon_attempted', 'checkout', 'checkout', 'checkout', '尝试输入优惠码', array[]::text[], array['value', 'currency']),
  ('wishlist_added', 'intent', 'consideration', 'product', '加入愿望单', array['product_id'], array['page_url'])
on conflict (event_name) do update
set
  category = excluded.category,
  stage = excluded.stage,
  page_scope = excluded.page_scope,
  description = excluded.description,
  required_params = excluded.required_params,
  recommended_params = excluded.recommended_params,
  updated_at = now();

create or replace view dashboard_behavior_summary_30d as
select
  shop_id,
  count(*) filter (where event_name = 'page_view')::int as page_views,
  count(distinct session_id)::int as sessions,
  count(distinct user_pseudo_id)::int as users,
  count(*) filter (where event_name = 'view_item')::int as product_views,
  count(*) filter (where event_name = 'add_to_cart')::int as add_to_carts,
  count(*) filter (where event_name = 'begin_checkout')::int as checkouts,
  count(*) filter (where event_name = 'purchase')::int as purchases,
  round(
    count(*) filter (where event_name = 'add_to_cart') * 100.0 /
    nullif(count(*) filter (where event_name = 'page_view'), 0),
    2
  ) as add_to_cart_rate,
  round(
    count(*) filter (where event_name = 'purchase') * 100.0 /
    nullif(count(distinct session_id), 0),
    2
  ) as purchase_rate
from user_behavior_events
where event_time >= now() - interval '30 days'
group by shop_id;

create or replace view dashboard_behavior_funnel_30d as
select
  shop_id,
  count(*) filter (where event_name = 'page_view')::int as landing_views,
  count(*) filter (where event_name = 'view_item_list')::int as list_views,
  count(*) filter (where event_name = 'view_item')::int as product_views,
  count(*) filter (where event_name = 'add_to_cart')::int as add_to_carts,
  count(*) filter (where event_name = 'view_cart')::int as cart_views,
  count(*) filter (where event_name = 'begin_checkout')::int as begin_checkout,
  count(*) filter (where event_name = 'purchase')::int as purchases
from user_behavior_events
where event_time >= now() - interval '30 days'
group by shop_id;

create or replace view dashboard_behavior_page_performance_30d as
select
  shop_id,
  coalesce(page_url, '(unknown)') as page_url,
  coalesce(page_type, 'other') as page_type,
  count(*) filter (where event_name = 'page_view')::int as page_views,
  count(*) filter (where event_name = 'view_item')::int as product_views,
  count(*) filter (where event_name = 'add_to_cart')::int as add_to_carts,
  count(*) filter (where event_name = 'purchase')::int as purchases,
  round(
    count(*) filter (where event_name = 'add_to_cart') * 100.0 /
    nullif(count(*) filter (where event_name = 'page_view'), 0),
    2
  ) as add_to_cart_rate,
  round(
    count(*) filter (where event_name = 'purchase') * 100.0 /
    nullif(count(*) filter (where event_name = 'page_view'), 0),
    2
  ) as purchase_rate
from user_behavior_events
where event_time >= now() - interval '30 days'
group by shop_id, coalesce(page_url, '(unknown)'), coalesce(page_type, 'other');

create or replace view dashboard_behavior_channel_30d as
select
  shop_id,
  coalesce(channel_primary, 'unknown') as channel,
  count(distinct session_id)::int as sessions,
  count(distinct user_pseudo_id)::int as users,
  count(*) filter (where event_name = 'add_to_cart')::int as add_to_carts,
  count(*) filter (where event_name = 'begin_checkout')::int as checkouts,
  count(*) filter (where event_name = 'purchase')::int as purchases,
  round(
    count(*) filter (where event_name = 'purchase') * 100.0 /
    nullif(count(distinct session_id), 0),
    2
  ) as purchase_rate
from user_behavior_events
where event_time >= now() - interval '30 days'
group by shop_id, coalesce(channel_primary, 'unknown');

alter table behavior_event_definitions enable row level security;
alter table user_behavior_events enable row level security;
