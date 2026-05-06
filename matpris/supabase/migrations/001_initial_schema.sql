-- supabase/migrations/001_initial_schema.sql
-- Initial schema for Matpris MVP.
--
-- This schema matches the current JavaScript app contract:
-- - receipts.chain
-- - prices.store
-- - prices.receipt_id -> receipts.id
-- - product_aliases for OCR normalization

begin;

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  last_scan_at timestamptz,
  access_expires timestamptz,
  total_scans integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  brand text,
  category text,
  barcode text,
  weight_volume text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, brand, weight_volume)
);

create table if not exists public.product_aliases (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  alias text not null,
  store text,
  source text not null default 'ocr',
  created_at timestamptz not null default now(),
  unique(product_id, alias, store)
);

create table if not exists public.receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid,
  chain text not null,
  receipt_date date,
  scanned_at timestamptz not null default now(),
  image_url text,
  ocr_raw_text text,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  item_count integer not null default 0,
  total_amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prices (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  store text not null,
  price numeric not null check (price > 0),
  unit_price numeric,
  quantity numeric not null default 1,
  observed_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_product_aliases_alias on public.product_aliases(alias);
create index if not exists idx_product_aliases_product on public.product_aliases(product_id);
create index if not exists idx_receipts_user_scanned on public.receipts(user_id, scanned_at);
create index if not exists idx_receipts_chain_scanned on public.receipts(chain, scanned_at);
create index if not exists idx_prices_product_store_date on public.prices(product_id, store, observed_date);
create index if not exists idx_prices_receipt on public.prices(receipt_id);

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_aliases enable row level security;
alter table public.receipts enable row level security;
alter table public.prices enable row level security;

commit;
