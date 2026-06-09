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
