# Matpris

A crowdsourced grocery price comparison app for Norway. Users scan physical receipts with their phone camera — the app extracts items and prices via OCR and contributes them to a shared database. To maintain access, users must scan at least one receipt per month, keeping the data fresh and community-driven.

---

## Features

- **Receipt scanning** — camera-based flow with Google Cloud Vision OCR
- **Receipt parsing** — handles multi-line (Rema 1000) and inline-price (Kiwi, Coop) receipt formats
- **Price comparison** — compare prices across 8 Norwegian grocery chains in real time
- **Store & category filtering** — horizontal scrollable filter bar
- **Deals screen** — dedicated view for current offers
- **Access gate** — users lose access if they don't scan within 30 days
- **Authentication** — email/password auth via Supabase, session stored in device secure storage
- **Row-level security** — all users can read prices; only the receipt owner can write their own data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| OCR | Google Cloud Vision API |
| Auth storage | expo-secure-store |

---

## How the OCR Pipeline Works

1. User photographs a receipt in-app
2. Image is base64-encoded and sent to Google Cloud Vision (`TEXT_DETECTION`)
3. Raw text is parsed with two strategies:
   - **Multi-line format** — detects `NAME / VAT% / PRICE` patterns (Rema 1000)
   - **Inline format** — detects `NAME ... PRICE` on a single line (Kiwi, Coop)
4. Noise lines (totals, VAT, payment info, etc.) are filtered via a keyword blocklist
5. Parsed items are confirmed by the user before being written to the database

---

## Database Schema (Supabase/PostgreSQL)

- **users** — auth identity, scan history, access expiry
- **stores** — store locations per chain
- **products** — canonical product list with barcode and category
- **product_aliases** — OCR variant names mapped to canonical products
- **receipts** — scanned receipt metadata + raw OCR text
- **prices** — price per product per store per receipt
- **current_prices** — materialized view of the latest known price per product per chain
- **unmatched_items** — queue of OCR results that didn't match any known product

---

## Project Structure

```
matpris/
├── App.js                    # Root — auth gate, screen pager, navigation
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js     # Search, filter, product list
│   │   ├── TilbudScreen.js   # Deals
│   │   ├── ScanScreen.js     # 4-step receipt scan flow
│   │   ├── ProfileScreen.js  # User profile, access status, scan history
│   │   └── LoginScreen.js    # Auth
│   ├── components/
│   │   ├── BottomNav.js
│   │   ├── ProductCard.js
│   │   ├── ProductDetail.js  # Per-store price comparison modal
│   │   └── StoreFilter.js
│   └── utils/
│       ├── supabase.js       # Supabase client with SecureStore session adapter
│       ├── ocr.js            # Google Cloud Vision + receipt parser
│       ├── helpers.js
│       └── constants.js      # Stores, colors, categories
```

---

## How to run

**1. Install dependencies** — run this in your terminal:
```bash
npm install
```

**2. Create a `.env` file** in the project root folder with your API keys:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_VISION_KEY=your_vision_api_key
```

**3. Start the app** — run this in your terminal:
```bash
npx expo start
```

Then scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone, or press `i` for iOS simulator / `a` for Android emulator.
