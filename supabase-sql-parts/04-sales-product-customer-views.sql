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
