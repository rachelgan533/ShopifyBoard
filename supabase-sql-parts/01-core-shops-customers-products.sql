create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  shop_domain text unique not null,
  shop_name text,
  currency text default 'USD',
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists data_integrations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source text not null,
  status text default 'disconnected',
  config jsonb default '{}'::jsonb,
  last_connected_at timestamptz,
  last_tested_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, source)
);

create table if not exists sync_state (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source text not null,
  resource text not null,
  last_synced_at timestamptz,
  cursor text,
  status text default 'idle',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (shop_id, source, resource)
);

create table if not exists customers (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  first_order_at timestamptz,
  last_order_at timestamptz,
  orders_count int default 0,
  total_spent numeric default 0,
  country text,
  province text,
  city text,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  shop_id uuid references shops(id) on delete cascade,
  title text,
  handle text,
  vendor text,
  product_type text,
  status text,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
