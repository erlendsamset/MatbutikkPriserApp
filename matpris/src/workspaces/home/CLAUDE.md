# Home Workspace — Search & Product Listing

User flow: Search for products, filter by store, view price comparisons.

## Scope

- **HomeScreen** — Main search interface, product list, store filter
- **ProductCard** — Individual product item in list
- **ProductDetail** — Bottom sheet modal with price breakdown per store
- **StoreFilter** — Horizontal chip filter for store selection

## State Flow

- **Props from App.js:** `daysLeft`, `refreshKey`
- **Local state:** `searchQuery`, `selectedStore`, `sortOrder`, `selectedProduct`, `products`
- **Data source:** Supabase `prices` table (via HomeScreen.fetchProducts)
- **Updates:** When `refreshKey` changes, refetch products from database

## Dependencies

- `../../_shared/constants` — COLORS, STORES, design tokens
- `../../_shared/helpers` — formatPrice, getCheapestStore, getFilteredProducts, getStoreInfo
- `../../_shared/supabase` — Supabase client for queries

## Rules

- ProductCard and ProductDetail are read-only (no mutations)
- Store filter updates local state only
- Search/sort/filter logic is pure (no side effects)
- All database queries happen in HomeScreen only
