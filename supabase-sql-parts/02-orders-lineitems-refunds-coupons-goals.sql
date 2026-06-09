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
