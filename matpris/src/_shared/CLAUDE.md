# _shared/ — Global Utilities

Shared code reused across all workspaces. No workspace-specific logic lives here.

## Files

- **constants.js** — Color palette, store definitions, sample data
- **helpers.js** — Pure functions: formatPrice(), getCheapestStore(), getFilteredProducts(), getStoreInfo()
- **ocr.js** — OCR parsing: parseReceiptText(), extractWeight(), runOCR(), validation helpers
- **supabase.js** — Supabase client initialization (auth + database)
- **BottomNav.js** — App-level navigation component (renders at root level)

## Rules

- No component state (except BottomNav which is root-level)
- No workspace-specific imports
- All exports must be reusable by multiple workspaces
- Keep functions pure when possible
