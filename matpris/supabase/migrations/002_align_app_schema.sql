-- supabase/migrations/002_align_app_schema.sql
-- Idempotent alignment for databases created from the older MVP schema.
--
-- Safe to run in Supabase SQL Editor. It keeps existing data where possible and
-- aligns table/column names with the current app contract.

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
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists brand text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists weight_volume text;
alter table public.products add column if not exists verified boolean not null default false;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

create table if not exists public.receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  chain text,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'receipts'
      and column_name = 'store_chain'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'receipts'
      and column_name = 'chain'
  ) then
    alter table public.receipts rename column store_chain to chain;
  end if;
end $$;

alter table public.receipts add column if not exists store_id uuid;
alter table public.receipts add column if not exists chain text;
alter table public.receipts add column if not exists receipt_date date;
alter table public.receipts add column if not exists image_url text;
alter table public.receipts add column if not exists ocr_raw_text text;
alter table public.receipts add column if not exists status text not null default 'pending';
alter table public.receipts add column if not exists item_count integer not null default 0;
alter table public.receipts add column if not exists total_amount numeric;
alter table public.receipts add column if not exists scanned_at timestamptz not null default now();
alter table public.receipts add column if not exists created_at timestamptz not null default now();
alter table public.receipts add column if not exists updated_at timestamptz not null default now();

update public.receipts
set chain = 'unknown'
where chain is null;

alter table public.receipts alter column chain set not null;

create table if not exists public.product_aliases (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  alias text not null,
  store text,
  source text not null default 'ocr',
  created_at timestamptz not null default now()
);

alter table public.product_aliases add column if not exists store text;
alter table public.product_aliases add column if not exists source text not null default 'ocr';
alter table public.product_aliases add column if not exists created_at timestamptz not null default now();

create table if not exists public.prices (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  receipt_id uuid references public.receipts(id) on delete cascade,
  store text,
  price numeric not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prices'
      and column_name = 'store_chain'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prices'
      and column_name = 'store'
  ) then
    alter table public.prices rename column store_chain to store;
  end if;
end $$;

alter table public.prices add column if not exists receipt_id uuid references public.receipts(id) on delete cascade;
alter table public.prices add column if not exists store text;
alter table public.prices add column if not exists unit_price numeric;
alter table public.prices add column if not exists quantity numeric not null default 1;
alter table public.prices add column if not exists observed_date date not null default current_date;
alter table public.prices add column if not exists created_at timestamptz not null default now();

update public.prices
set store = 'unknown'
where store is null;

alter table public.prices alter column store set not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prices'
      and column_name = 'user_id'
  ) then
    alter table public.prices alter column user_id drop not null;
  end if;
end $$;

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
