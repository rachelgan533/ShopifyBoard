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
  (
    'module_view',
    'module',
    'awareness',
    'all',
    '页面模块曝光，例如首页 Hero、商品评价、FAQ、配送说明、加购推荐',
    array['module_id'],
    array['module_type', 'module_name', 'module_position', 'experiment_id', 'variant_name']
  ),
  (
    'module_click',
    'module',
    'intent',
    'all',
    '页面模块点击，例如 CTA、推荐商品、悬浮加购按钮',
    array['module_id'],
    array['module_type', 'module_name', 'module_position', 'product_id', 'variant_id']
  ),
  (
    'module_expand',
    'module',
    'consideration',
    'all',
    '页面模块展开，例如评价、FAQ、配送与退换说明、规格对比',
    array['module_id'],
    array['module_type', 'module_name', 'module_position', 'product_id']
  ),
  (
    'module_submit',
    'module',
    'intent',
    'all',
    '页面模块提交，例如站内搜索、邮件订阅、测评问卷',
    array['module_id'],
    array['module_type', 'module_name', 'module_position', 'search_term']
  ),
  (
    'module_dismiss',
    'module',
    'friction',
    'all',
    '页面模块关闭或跳过，例如弹窗关闭、优惠提醒关闭',
    array['module_id'],
    array['module_type', 'module_name', 'module_position']
  )
on conflict (event_name) do update
set
  category = excluded.category,
  stage = excluded.stage,
  page_scope = excluded.page_scope,
  description = excluded.description,
  required_params = excluded.required_params,
  recommended_params = excluded.recommended_params,
  updated_at = now();
