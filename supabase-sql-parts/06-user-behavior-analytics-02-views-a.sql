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
