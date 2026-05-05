# iOS Minimal MVP Design — Phased Supabase Approach

**Date:** 2026-05-05  
**Target:** iOS App Store publication with core scanning + OCR feature  
**Scope:** Anonymous scanning workflow with real data in Supabase

---

## Overview

Launch a minimal version of Matpris with the core user value: users can scan receipts, extract prices via Google Cloud Vision OCR, and contribute real price data. No authentication required. Data is immediately available to all users via anonymous device IDs.

**Key constraint:** Minimal schema, maximum focus on making scanning work reliably.

---

## User Flow

```
Anonymous User
  ↓ Opens App
  ↓ Browse Products / Prices (read-only, from Supabase)
  ↓ Tap "Scan Receipt"
  ↓ Take Photo (camera)
  ↓ Upload to Supabase Storage
  ↓ Send to Google Cloud Vision API
  ↓ Review OCR Results (user corrects/deletes items)
  ↓ Match text to Products table (fuzzy match)
  ↓ Confirm & Save as Prices
  ↓ Receipt marked 'processed'
  ↓ HomeScreen refreshes, new prices visible
```

User never creates account. Each device has a unique `deviceId` (UUID, stored locally in secure storage).

---

## Supabase Schema (Minimal)

### Table: `products`
Pre-populated by team. One record per unique grocery item.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | e.g. "Melk 1L" |
| brand | text | e.g. "Tine" |
| category | text | e.g. "dairy" |
| barcode | text | Optional; for future use |
| weight_volume | text | e.g. "1L", "500g" |
| created_at | timestamp | |

**Constraints:** Unique (name, brand, weight_volume). At least 100-200 products seeded before launch.

### Table: `prices`
Populated by users scanning receipts. One record per item per receipt.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| product_id | uuid | Foreign key to products |
| store_chain | text | e.g. "rema", "kiwi", "coop_prix" |
| price | numeric | NOK (e.g., 29.90) |
| quantity | integer | e.g., 1, 6 (for multi-packs) |
| receipt_date | date | When item was purchased |
| device_id | uuid | Device that submitted this price |
| scanned_at | timestamp | When it was scanned |
| created_at | timestamp | |

**Constraints:** Index on (product_id, store_chain, receipt_date) for fast lookups on HomeScreen.

### Table: `receipts`
Tracks metadata for each scan event.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| device_id | uuid | Device that submitted |
| store_chain | text | e.g. "rema", "kiwi" |
| image_url | text | Path in Supabase Storage, e.g. `receipts/device-uuid/timestamp.jpg` |
| ocr_raw_text | text | Raw output from Google Cloud Vision |
| item_count | integer | Number of items extracted by OCR |
| status | enum | 'pending' or 'processed' |
| scanned_at | timestamp | |
| created_at | timestamp | |

**Constraints:** Index on (device_id, scanned_at) for quick history lookups.

### Row-Level Security (RLS)

- **products:** Public read, no writes (only team can insert).
- **prices:** Public read, anyone can insert (no auth check — device_id is sufficient).
- **receipts:** Public read, anyone can insert.

---

## Scanning Flow (Detailed)

### 1. Photo Capture
- User taps "Scan Receipt" → camera screen opens (already exists in ScanScreen.js)
- User takes photo, saved to temp file
- User reviews photo, confirms to proceed

### 2. Upload & OCR
- Photo uploaded to Supabase Storage at `receipts/{deviceId}/{timestamp}.jpg`
- Image path stored temporarily in state
- App sends image to Google Cloud Vision API (backend or direct via Expo)
  - **Option A (simpler):** Call Vision API directly from app (requires API key in env)
  - **Option B (more secure):** Call Edge Function → Edge Function calls Vision API
  - *Recommendation:* Option A for MVP (faster), migrate to Option B post-launch
- Receive OCR text and item list back

### 3. Review & Correction
- Display extracted items in a list (already have mock in ScanScreen.js)
- User can:
  - Mark quantity (multi-packs, etc.)
  - Delete items that are wrong
  - Manual corrections if OCR failed
- User taps "Confirm" to proceed to store/price entry

### 4. Match to Products
- For each OCR item, app fuzzy-matches against `products` table
- Show best matches to user (e.g., "Is this 'Melk 1L, Tine'? yes/no/other")
- If no match found, allow user to skip or search manually
- Build final list: [product_id, store_chain, price, quantity]

### 5. Save Prices
- User enters store chain (dropdown from STORES in constants.js)
- User reviews prices/items one more time
- Tap "Submit" → insert records into `prices` and `receipts` tables
- Receipt marked status='processed'
- Local state cleared, return to HomeScreen
- HomeScreen fetches latest prices and refreshes (via refetch or real-time listener)

---

## Device Identification

**Device ID Setup (on first app launch):**
```javascript
// In App.js or a utils/device.js
import * as SecureStore from 'expo-secure-store';

async function getOrCreateDeviceId() {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    deviceId = UUID.v4();
    await SecureStore.setItemAsync('deviceId', deviceId);
  }
  return deviceId;
}
```

- Stored in Expo SecureStore (native encrypted storage)
- Retrieved once on app startup
- Passed with every insert to `prices` and `receipts`
- No personal data attached; device is anonymous

---

## Data Flow: HomeScreen (Read Path)

```javascript
// Pseudocode
useEffect(() => {
  const { data: prices } = await supabase
    .from('prices')
    .select('*, product:products(*)')
    .order('scanned_at', { ascending: false });
  
  // Group by product, find cheapest per store
  // Display in existing HomeScreen UI
}, []);
```

Products and prices are publicly readable. HomeScreen queries latest prices, groups by product, shows cheapest store — same logic as today, just pulling from real Supabase data instead of SAMPLE_DATA.

---

## What's NOT Included (Post-Launch)

- User accounts / authentication
- User profiles / scan history per user
- Price history graphs
- Shopping lists
- Push notifications
- Advanced filtering (price trends, etc.)
- Offline mode / local caching

These are good Phase 2 features after launch validates the core scanning loop.

---

## Implementation Sequence

1. **Supabase Setup** (1–2 days)
   - Create tables (products, prices, receipts)
   - Seed products table (200+ items)
   - Set up RLS policies
   - Create Supabase Storage bucket for receipts

2. **Device ID & Auth Context** (0.5 day)
   - Implement device ID retrieval + storage
   - Create app-level context for deviceId
   - Make available to all screens

3. **Google Cloud Vision Integration** (1–2 days)
   - Set up API key (already have one)
   - Implement OCR call from ScanScreen
   - Test with sample receipts

4. **Scanning Flow Implementation** (3–4 days)
   - Wire photo upload to Supabase Storage
   - Display OCR results with edit UI
   - Implement product fuzzy-matching
   - Build price entry & confirmation step
   - Insert prices/receipts into Supabase

5. **HomeScreen Data Integration** (1–2 days)
   - Replace SAMPLE_DATA queries with Supabase queries
   - Test real-time updates (if using listeners)
   - Test filtering, sorting, product detail

6. **Testing & Polish** (1–2 days)
   - End-to-end scan flow testing
   - Edge cases (no matches, failed OCR, upload errors)
   - Error messages + fallbacks
   - Performance (image upload size, OCR latency)

**Estimated total:** ~8–12 days of focused work

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| No user auth for MVP | Simpler launch; device ID is enough to attribute prices |
| Device ID in SecureStore | Persists across app launches; can't be easily changed by user |
| Google Cloud Vision direct call | Faster MVP; can refactor to Edge Function later |
| Pre-populated products table | Avoids needing a product search/creation UX; focus on scanning |
| Manual correction step before save | Reduces bad data; user has last-mile validation |
| Public RLS on all tables | Everyone can see prices (core value); no auth overhead |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Bad OCR data pollutes database | Manual review step + fuzzy matching + user correction |
| API key exposure (GCV key) | Use environment variable; migrate to Edge Function post-launch |
| Duplicate prices for same item | Unique constraint on (product_id, store_chain, receipt_date) optional; app dedupes on UX |
| Storage quota (images) | Compress images before upload; monitor Supabase usage |
| Slow OCR API calls | Show loading spinner; timeout after 30s with fallback to manual entry |

---

## Success Criteria

- ✅ App available on iOS App Store
- ✅ New user can scan a receipt end-to-end without creating account
- ✅ OCR extracts 80%+ of items correctly
- ✅ Prices appear in HomeScreen within 5 seconds of confirmation
- ✅ Existing browse/filter features still work with real data
- ✅ No auth screens blocking entry
