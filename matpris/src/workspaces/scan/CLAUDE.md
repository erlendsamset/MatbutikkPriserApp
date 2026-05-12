# Scan Workspace — Receipt Scanning

User flow: Take photo → Select store → Confirm items → View result with price comparisons.

## Scope

- **ScanScreen** — 4-step scanning workflow (camera → store selection → item review → completion)
- **Components/** — (Future: receipt preview, item editor, etc.)

## Scanning Flow

1. **Step 1:** Camera photo + crop to receipt bounds
2. **Step 2:** Store selection from STORES dropdown
3. **Step 3:** Review OCR results (deduplicated items with quantities)
4. **Step 4:** Submit to database (creates receipt + price entries)

## Key Functions (in ScanScreen)

- `normalize(name)` — Lowercase + remove punctuation for product matching
- `cleanProductName(name)` — Remove trailing VAT% for display
- `deduplicateItems(items)` — Group by normalized name, track quantity
- `fuzzyFind(key, aliasMap)` — Levenshtein distance matching (~15% threshold)
- `prepareImageForOCR(uri)` — Compress + orient image for OCR API
- `handleSubmit(items, store)` — Main submission logic:
  - Fetch existing products by alias (fuzzy matching)
  - Create new products + aliases for unmatched items
  - Handle gram variant logic (first-gram-wins strategy)
  - Insert price entries and deduplication counts

## Dependencies

- `../../_shared/constants` — STORES, COLORS
- `../../_shared/supabase` — Database queries (product_aliases, products, prices, receipts)
- `../../_shared/ocr` — parseReceiptText, extractWeight, runOCR

## State Flow

- **Props from App.js:** `onGoBack`, `totalScans`, `onScanComplete` (callback)
- **Local state:** `step`, `image`, `selectedStore`, `scannedItems`, `loading`
- **Mutations:** Create products, aliases, receipts, prices in Supabase

## Rules

- All OCR logic stays in _shared/ocr.js (format handlers, parsing)
- ScanScreen does deduplication + fuzzy matching coordination
- No state sharing with other workspaces
- Call `onScanComplete` after successful submission
