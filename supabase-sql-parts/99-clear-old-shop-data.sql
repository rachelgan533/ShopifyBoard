-- 先运行这一句确认旧店铺域名：
-- select id, shop_domain, shop_name, created_at from shops order by created_at desc;

do $$
declare
  old_domain text := 'bohealthy.myshopify.com'; -- TODO: 改成要清空的旧店铺 myshopify 域名
  old_shop_id uuid;
  table_name text;
  tables_in_delete_order text[] := array[
    'user_behavior_events',
    'traffic_attribution_daily',
    'search_console_metrics',
    'audience_segments',
    'ad_daily_metrics',
    'ga4_daily_metrics',
    'refunds',
    'order_line_items',
    'orders',
    'products',
    'customers',
    'coupon_codes',
    'goals',
    'sync_state',
    'data_integrations'
  ];
begin
  select id
    into old_shop_id
    from shops
   where shop_domain = old_domain
   limit 1;

  if old_shop_id is null then
    raise exception 'Shop domain % not found in shops table', old_domain;
  end if;

  foreach table_name in array tables_in_delete_order loop
    if to_regclass('public.' || table_name) is not null then
      execute format('delete from %I where shop_id = $1', table_name) using old_shop_id;
    end if;
  end loop;

  delete from shops where id = old_shop_id;
  raise notice 'Cleared old shop data for % (%)', old_domain, old_shop_id;
end $$;
