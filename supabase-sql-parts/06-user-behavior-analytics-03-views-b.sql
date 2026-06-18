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
