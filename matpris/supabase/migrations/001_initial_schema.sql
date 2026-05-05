-- supabase/migrations/001_initial_schema.sql
-- Initial schema for Matpris MVP

-- Products table: all available grocery items (pre-populated by team)
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  brand text,
  category text,
  barcode text,
  weight_volume text,
  created_at timestamp default now(),
  unique(name, brand, weight_volume)
);

create index idx_products_category on public.products(category);
create index idx_products_name on public.products(name);

-- Prices table: price data contributed by users (one entry per item per receipt)
create table public.prices (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade,
  store_chain text not null,
  price numeric not null,
  quantity integer default 1,
  receipt_date date not null,
  user_id uuid references auth.users(id) on delete cascade,
  scanned_at timestamp default now(),
  created_at timestamp default now()
);

create index idx_prices_product_store_date on public.prices(product_id, store_chain, receipt_date);
create index idx_prices_user_scanned on public.prices(user_id, scanned_at);

-- Receipts table: metadata about each scanned receipt
create table public.receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  store_chain text not null,
  image_url text,
  ocr_raw_text text,
  item_count integer,
  status text default 'pending' check(status in ('pending', 'processed')),
  scanned_at timestamp default now(),
  created_at timestamp default now()
);

create index idx_receipts_user_scanned on public.receipts(user_id, scanned_at);

-- Enable RLS on all tables
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.receipts enable row level security;

-- Products: public read, only backend (via service role) can insert
create policy "products_read_public" on public.products
  for select using (true);

-- Prices: public read, authenticated users can insert their own records
create policy "prices_read_public" on public.prices
  for select using (true);

create policy "prices_insert_authenticated" on public.prices
  for insert with check (auth.uid() = user_id);

-- Receipts: public read, authenticated users can insert their own records
create policy "receipts_read_public" on public.receipts
  for select using (true);

create policy "receipts_insert_authenticated" on public.receipts
  for insert with check (auth.uid() = user_id);

-- Storage RLS for receipts bucket
create policy "receipts_upload" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts_read" on storage.objects
  for select using (bucket_id = 'receipts');
