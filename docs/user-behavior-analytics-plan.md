# 用户行为分析看板设计

## 目标

在现有 `Shopify + GA4 + Search Console + Ads` 的基础上，新增一层 **用户行为分析**，用于回答：

1. 用户从哪里来
2. 用户在站内怎么走
3. 哪些页面和内容更容易促成转化
4. 哪些行为是高购买意图信号
5. 哪些用户群体更容易完成加购、结账和购买

这层分析和现有页面的分工建议如下：

- `归因分析`：来源和渠道贡献
- `客户分析`：用户是谁、价值如何
- `运营数据看板`：经营结果
- `用户行为分析`：用户在站内做了什么、怎么流失、哪里最值得优化

## 数据分层

### 1. 自动采集层

优先开启 GA4 自带的基础采集能力：

- `first_visit`
- `session_start`
- `page_view`
- `user_engagement`
- Enhanced Measurement 中的滚动、站内搜索、外链点击

### 2. 电商推荐事件层

必须覆盖的电商主干事件：

- `view_item_list`
- `select_item`
- `view_item`
- `add_to_cart`
- `remove_from_cart`
- `view_cart`
- `begin_checkout`
- `add_shipping_info`
- `add_payment_info`
- `purchase`
- `refund`

### 3. 自定义行为事件层

用于挖用户路径、内容表现和高意图行为：

- `page_section_view`
- `scroll_depth_reached`
- `variant_selected`
- `size_guide_opened`
- `review_opened`
- `faq_opened`
- `shipping_info_opened`
- `delivery_estimator_used`
- `image_gallery_interaction`
- `video_played`
- `coupon_attempted`
- `wishlist_added`
- `notify_me_clicked`
- `site_search`
- `filter_applied`
- `sort_changed`
- `collection_viewed`
- `menu_clicked`
- `breadcrumb_clicked`

## 事件模型

### 核心主键

- `session_id`
- `user_pseudo_id`
- `customer_id`
- `event_time`
- `event_name`

### 通用字段

- `shop_id`
- `event_time`
- `event_name`
- `session_id`
- `user_pseudo_id`
- `customer_id`
- `page_url`
- `page_type`
- `referrer`
- `channel_primary`
- `device_category`
- `country`
- `city`
- `product_id`
- `variant_id`
- `collection_id`
- `value`
- `currency`
- `properties`

## 页面类型建议

- `home`
- `collection`
- `product`
- `cart`
- `checkout`
- `search`
- `article`
- `landing`
- `other`

## 一级渠道建议

- `direct`
- `organic`
- `ads`
- `edm`
- `community`
- `sns`
- `pr`
- `kol`
- `affiliate`
- `unknown`

这套渠道口径应与现有 `归因分析` 页面保持一致。

## 行为分析看板结构

### 1. 行为总览

- Sessions
- Users
- New Users
- Avg Engagement Time
- Pages / Session
- Add to Cart Rate
- Checkout Rate
- Purchase Rate
- Revenue / Session

### 2. 行为漏斗

建议顺序：

`Landing Page -> Collection View -> Product View -> Add to Cart -> View Cart -> Begin Checkout -> Purchase`

支持切片：

- 渠道
- 设备
- 国家
- 新客 / 回头客

### 3. Top 用户路径

先做 session 级别路径序列，不要一开始就做复杂路径图。

示例：

- 首页 -> PDP -> 加购 -> 购买
- 广告落地页 -> PDP -> FAQ -> 加购 -> 流失
- 搜索 -> 集合页 -> PDP -> 返回搜索 -> PDP -> 购买

### 4. 页面表现

- Top Landing Pages
- Top PDP
- PDP 停留时间
- PDP 加购率
- PDP 购买率
- FAQ 点击率
- Review 打开率
- Variant 切换率

### 5. 用户分群洞察

按：

- 年龄
- 性别
- 国家
- 城市
- 设备
- 渠道
- 新客 / 回头客

看：

- Sessions
- Add to Cart Rate
- Checkout Rate
- Purchase Rate
- AOV
- Revenue / Session

### 6. 高意图行为监控

- 多次看同一 PDP
- 打开评价但未加购
- 使用优惠码但未支付
- 高停留时长但未购买
- 多次返回购物车
- 进入 Checkout 后支付失败

## Shopify / GA4 / Pixel 接入建议

### Shopify Web Pixels

负责拿到 Shopify storefront 相关原生事件，用于和订单链路对齐。

### GA4

负责统一事件分析、受众维度、渠道、设备、地区和站内路径。

### 第一方事件入库

建议把关键行为事件同时落到 Supabase，避免只依赖 GA4 UI。

## 建议的埋点优先级

### 第一阶段

先接这 10 个：

1. `page_view`
2. `view_item_list`
3. `view_item`
4. `add_to_cart`
5. `view_cart`
6. `begin_checkout`
7. `purchase`
8. `site_search`
9. `filter_applied`
10. `review_opened`

### 第二阶段

- `variant_selected`
- `coupon_attempted`
- `faq_opened`
- `shipping_info_opened`
- `payment_failed`
- `wishlist_added`

## 推荐实施顺序

1. 先落 `行为事件表`
2. 再补 `埋点字典`
3. 再把 Shopify Pixel / GA4 事件汇入
4. 再做行为漏斗和路径面板
5. 最后做高意图识别与自动分群

## 对应 SQL

行为事件数据表和基础视图建议见：

- `/Users/rachel/Documents/Codex/2026-06-09/vercel-supabase-shopify/supabase-sql-parts/06-user-behavior-analytics.sql`
