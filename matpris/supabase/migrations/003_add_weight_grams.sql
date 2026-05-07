-- supabase/migrations/003_add_weight_grams.sql
-- Adds weight_grams column to products table for kg-price calculations.
--
-- Idempotent: safe to run multiple times in Supabase SQL Editor.

begin;

alter table public.products add column if not exists weight_grams integer;

-- Index for filtering products with weight data
create index if not exists idx_products_weight_grams on public.products(weight_grams);

commit;
