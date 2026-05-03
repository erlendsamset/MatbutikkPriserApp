-- Matpris RLS-oppsett
-- Kjør i Supabase SQL Editor.
-- Denne filen fokuserer på tabeller appen bruker aktivt nå:
-- users, receipts, prices, products, product_aliases

begin;

-- 1) Slå på RLS
alter table if exists public.users enable row level security;
alter table if exists public.receipts enable row level security;
alter table if exists public.prices enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.product_aliases enable row level security;

-- 2) Fjern gamle policies med samme navn (idempotent kjøring)
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_insert_own" on public.users;

drop policy if exists "receipts_select_own" on public.receipts;
drop policy if exists "receipts_insert_own" on public.receipts;
drop policy if exists "receipts_update_own" on public.receipts;
drop policy if exists "receipts_delete_own" on public.receipts;

drop policy if exists "prices_select_all" on public.prices;
drop policy if exists "prices_insert_owner_receipt" on public.prices;
drop policy if exists "prices_update_owner_receipt" on public.prices;
drop policy if exists "prices_delete_owner_receipt" on public.prices;

drop policy if exists "products_select_all" on public.products;
drop policy if exists "products_insert_authenticated" on public.products;
drop policy if exists "products_update_authenticated" on public.products;

drop policy if exists "product_aliases_select_all" on public.product_aliases;
drop policy if exists "product_aliases_insert_authenticated" on public.product_aliases;
drop policy if exists "product_aliases_update_authenticated" on public.product_aliases;

-- 3) users: kun egen profil
create policy "users_select_own"
on public.users
for select
to authenticated
using (auth.uid() = auth_id);

create policy "users_insert_own"
on public.users
for insert
to authenticated
with check (auth.uid() = auth_id);

create policy "users_update_own"
on public.users
for update
to authenticated
using (auth.uid() = auth_id)
with check (auth.uid() = auth_id);

-- 4) receipts: kun egne kvitteringer
create policy "receipts_select_own"
on public.receipts
for select
to authenticated
using (auth.uid() = user_id);

create policy "receipts_insert_own"
on public.receipts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "receipts_update_own"
on public.receipts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "receipts_delete_own"
on public.receipts
for delete
to authenticated
using (auth.uid() = user_id);

-- 5) prices: alle kan lese, men skrive kun via egne receipts
create policy "prices_select_all"
on public.prices
for select
to authenticated
using (true);

create policy "prices_insert_owner_receipt"
on public.prices
for insert
to authenticated
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = prices.receipt_id
      and r.user_id = auth.uid()
  )
);

create policy "prices_update_owner_receipt"
on public.prices
for update
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = prices.receipt_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = prices.receipt_id
      and r.user_id = auth.uid()
  )
);

create policy "prices_delete_owner_receipt"
on public.prices
for delete
to authenticated
using (
  exists (
    select 1
    from public.receipts r
    where r.id = prices.receipt_id
      and r.user_id = auth.uid()
  )
);

-- 6) products: alle kan lese, innloggede kan opprette/oppdatere
create policy "products_select_all"
on public.products
for select
to authenticated
using (true);

create policy "products_insert_authenticated"
on public.products
for insert
to authenticated
with check (true);

create policy "products_update_authenticated"
on public.products
for update
to authenticated
using (true)
with check (true);

-- 7) product_aliases: alle kan lese, innloggede kan opprette/oppdatere
create policy "product_aliases_select_all"
on public.product_aliases
for select
to authenticated
using (true);

create policy "product_aliases_insert_authenticated"
on public.product_aliases
for insert
to authenticated
with check (true);

create policy "product_aliases_update_authenticated"
on public.product_aliases
for update
to authenticated
using (true)
with check (true);

commit;
