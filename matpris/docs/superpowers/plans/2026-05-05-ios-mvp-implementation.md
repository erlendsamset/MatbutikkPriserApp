# iOS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch iOS app with real Supabase data, scanning with OCR, and authenticated price submissions.

**Architecture:** 
- Backend: Supabase PostgreSQL with minimal schema (products, prices, receipts)
- Frontend: Existing screens (HomeScreen, ScanScreen, ProfileScreen) + auth guard
- Data flow: HomeScreen queries public products/prices → ScanScreen prompts login if needed → uploads receipt image → saves prices with user_id
- Key constraint: Hybrid auth (browse anonymous, scan authenticated)

**Tech Stack:** 
- Supabase (PostgreSQL, Auth, Storage)
- Expo (camera, image picker, file system)
- Google Cloud Vision API (OCR)
- React Native with existing StyleSheet patterns

---

## File Structure

**Files to create:**
- `src/utils/database.js` — Supabase query helpers (products, prices, receipts)
- `src/utils/imageUtils.js` — Image compression + Supabase Storage upload
- `src/utils/productMatching.js` — Fuzzy matching OCR text to products table
- `supabase/migrations/001_initial_schema.sql` — Tables, RLS, indexes

**Files to modify:**
- `src/screens/HomeScreen.js` — Replace SAMPLE_DATA with Supabase queries
- `src/screens/ScanScreen.js` — Add auth guard, integrate database/image/matching utilities
- `App.js` — Minor: pass session state down (already done, verify)

**No new screens or major components** — leverage existing UI.

---

## Phase 1: Supabase Setup

### Task 1: Create Supabase Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Context:** Supabase will automatically run migrations in `supabase/migrations/` when you push. Create this file with complete schema, indexes, and RLS policies.

- [ ] **Step 1: Create products table**

```sql
-- supabase/migrations/001_initial_schema.sql
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
```

- [ ] **Step 2: Create prices table**

```sql
-- Append to supabase/migrations/001_initial_schema.sql
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
```

- [ ] **Step 3: Create receipts table**

```sql
-- Append to supabase/migrations/001_initial_schema.sql
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
```

- [ ] **Step 4: Set up RLS policies**

```sql
-- Append to supabase/migrations/001_initial_schema.sql

-- Enable RLS on all tables
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.receipts enable row level security;

-- Products: public read, only admin insert
create policy "products_read_public" on public.products
  for select using (true);

-- Prices: public read, authenticated users can insert
create policy "prices_read_public" on public.prices
  for select using (true);

create policy "prices_insert_authenticated" on public.prices
  for insert with check (auth.uid() = user_id);

-- Receipts: public read, authenticated users can insert
create policy "receipts_read_public" on public.receipts
  for select using (true);

create policy "receipts_insert_authenticated" on public.receipts
  for insert with check (auth.uid() = user_id);
```

- [ ] **Step 5: Create storage bucket for receipts**

```sql
-- Append to supabase/migrations/001_initial_schema.sql

-- Create storage bucket (run via Supabase dashboard or CLI)
-- This should be done via Supabase UI: Storage → Create bucket "receipts"
-- Set public access: true
-- Allowed MIME types: image/jpeg, image/png
```

- [ ] **Step 6: Create Storage RLS policy (via SQL)**

```sql
-- Append to supabase/migrations/001_initial_schema.sql

-- Storage RLS for receipts bucket
create policy "receipts_upload" on storage.objects
  for insert with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts_read" on storage.objects
  for select using (bucket_id = 'receipts');
```

- [ ] **Step 7: Commit migration**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: create initial Supabase schema (products, prices, receipts)"
```

### Task 2: Seed Products Table

**Files:**
- Create: `supabase/seed.sql` (for local testing, optional but helpful)
- Modify: None (seed manually via Supabase dashboard or use seed.sql with `supabase db push`)

**Context:** You need at least 100-200 products seeded before HomeScreen can display real data. Create a seed file.

- [ ] **Step 1: Create seed file with sample products**

```sql
-- supabase/seed.sql
-- Insert common Norwegian grocery products
insert into public.products (name, brand, category, weight_volume) values
('Melk', 'Tine', 'melk_og_drikkevarer', '1L'),
('Smør', 'Tine', 'meieri', '250g'),
('Yoghurt', 'Tine', 'meieri', '150g'),
('Ost Geitost', 'Tine', 'meieri', '250g'),
('Brød Grahamsbrød', 'Kneipp', 'bakeri', '400g'),
('Brød Glutenfritt', 'Kneipp', 'bakeri', '300g'),
('Egg', 'Frittgående', 'meieri', '10 stk'),
('Kjøttdeig', 'Gilde', 'kjøtt', '500g'),
('Kyllingfilet', 'Gilde', 'kjøtt', '400g'),
('Biff', 'Gilde', 'kjøtt', '400g'),
('Tomat', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Løk', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Gulrot', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Poteter', 'Naturlig', 'frukt_og_grønt', '2kg'),
('Bananas', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Epler', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Appelsin', 'Naturlig', 'frukt_og_grønt', '1kg'),
('Hvitløk', 'Naturlig', 'frukt_og_grønt', '100g'),
('Pasta', 'Bariella', 'pasta_og_rise', '500g'),
('Ris', 'Kolik', 'pasta_og_rise', '1kg'),
('Drykkepulver', 'Tang', 'drikke', '250g'),
('Kaffe', 'Friele', 'drikke', '250g'),
('Tee', 'Lipton', 'drikke', '20 poser'),
('Juice', 'Molino', 'drikke', '1L'),
('Cola', 'Coca-Cola', 'drikke', '1.5L'),
('Kakao', 'Freia', 'drikke', '250g'),
('Oppvaskmidd', 'Dreft', 'rengjøring', '500ml'),
('Bleach', 'Jiff', 'rengjøring', '500ml'),
('Kjeks Safari', 'Opak', 'snacks', '150g'),
('Chips', 'Lay\'s', 'snacks', '200g');

-- Run with: supabase db push or insert manually via dashboard
```

- [ ] **Step 2: Commit seed file**

```bash
git add supabase/seed.sql
git commit -m "feat: add sample products for seeding"
```

### Task 3: Deploy Schema to Supabase

**Files:**
- None (deployment via CLI)

**Context:** Use Supabase CLI to push schema and seed data to your project.

- [ ] **Step 1: Initialize Supabase locally (if not done)**

```bash
cd /Users/erlend_samset/Kode\ prosjekter-----/MatbutikkPriserApp/matpris
supabase init
```

Expected output: `Initialized Supabase config in supabase/ directory`

- [ ] **Step 2: Link to your Supabase project**

```bash
supabase link --project-ref <your-project-ref>
```

(Get `<your-project-ref>` from your Supabase project settings URL)

- [ ] **Step 3: Push schema**

```bash
supabase db push
```

Expected: Migration applied successfully

- [ ] **Step 4: Verify tables exist**

In Supabase dashboard (Table Editor):
- Verify `products` table exists with columns (id, name, brand, category, barcode, weight_volume, created_at)
- Verify `prices` table exists with columns (id, product_id, store_chain, price, quantity, receipt_date, user_id, scanned_at, created_at)
- Verify `receipts` table exists with columns (id, user_id, store_chain, image_url, ocr_raw_text, item_count, status, scanned_at, created_at)

- [ ] **Step 5: Seed products (manually via dashboard or via SQL)**

Option A (Dashboard):
1. Go to SQL Editor
2. Paste content of `supabase/seed.sql`
3. Run query

Option B (CLI):
```bash
supabase db seed
```

Expected: 30+ products inserted

- [ ] **Step 6: No commit needed**

Supabase deployment is tracked in `.env.local` (not git). Migration files are committed (already done).

---

## Phase 2: Frontend Utilities

### Task 4: Create Database Query Helpers

**Files:**
- Create: `src/utils/database.js`

**Context:** Centralize Supabase queries. HomeScreen and ScanScreen will call these.

- [ ] **Step 1: Write helper to fetch all products**

```javascript
// src/utils/database.js
import { supabase } from "./supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  
  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return data || [];
}
```

- [ ] **Step 2: Write helper to fetch prices with product details**

```javascript
// Append to src/utils/database.js
export async function getPrices() {
  const { data, error } = await supabase
    .from("prices")
    .select("*, product:products(*)")
    .order("scanned_at", { ascending: false });
  
  if (error) throw new Error(`Failed to fetch prices: ${error.message}`);
  return data || [];
}
```

- [ ] **Step 3: Write helper to insert receipt**

```javascript
// Append to src/utils/database.js
export async function createReceipt(userId, storeChain, imageUrl, ocrRawText, itemCount) {
  const { data, error } = await supabase
    .from("receipts")
    .insert({
      user_id: userId,
      store_chain: storeChain,
      image_url: imageUrl,
      ocr_raw_text: ocrRawText,
      item_count: itemCount,
      status: "processed",
    })
    .select();
  
  if (error) throw new Error(`Failed to create receipt: ${error.message}`);
  return data?.[0];
}
```

- [ ] **Step 4: Write helper to insert prices**

```javascript
// Append to src/utils/database.js
export async function insertPrices(userId, prices) {
  // prices is array of { product_id, store_chain, price, quantity, receipt_date }
  const rows = prices.map((p) => ({
    ...p,
    user_id: userId,
    receipt_date: p.receipt_date || new Date().toISOString().split("T")[0],
  }));

  const { data, error } = await supabase
    .from("prices")
    .insert(rows)
    .select();
  
  if (error) throw new Error(`Failed to insert prices: ${error.message}`);
  return data || [];
}
```

- [ ] **Step 5: Write helper to find product by name (fuzzy match)**

```javascript
// Append to src/utils/database.js
export async function findProductByName(name) {
  // Exact search first
  const { data: exact } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${name}%`)
    .limit(5);
  
  if (exact && exact.length > 0) return exact;
  return [];
}
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/database.js
git commit -m "feat: add Supabase query helpers (products, prices, receipts)"
```

### Task 5: Create Image Upload & Compression Utility

**Files:**
- Create: `src/utils/imageUtils.js`

**Context:** Handle image compression before upload to Supabase Storage. Reduces bandwidth and OCR latency.

- [ ] **Step 1: Write image compression function**

```javascript
// src/utils/imageUtils.js
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export async function compressImage(imageUri, quality = 0.7) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1200, height: 1600 } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error("Image compression failed:", error);
    return imageUri; // Fallback to original
  }
}
```

- [ ] **Step 2: Write image upload to Supabase Storage**

```javascript
// Append to src/utils/imageUtils.js
import { supabase } from "./supabase";

export async function uploadReceiptImage(userId, imageUri) {
  try {
    // Read file
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const timestamp = new Date().getTime();
    const filename = `${userId}/${timestamp}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(filename, base64, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (error) throw error;
    return data.path;
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/imageUtils.js
git commit -m "feat: add image compression and Supabase Storage upload"
```

### Task 6: Create Product Matching Utility

**Files:**
- Create: `src/utils/productMatching.js`

**Context:** Match OCR-extracted product names to products table using fuzzy matching. Already have levenshtein logic in ScanScreen; extract and reuse.

- [ ] **Step 1: Write Levenshtein distance function**

```javascript
// src/utils/productMatching.js
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array(n + 1)
      .fill(0)
      .map((_, j) => (j === 0 ? i : 0))
  );

  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

const normalize = (str) =>
  str.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
```

- [ ] **Step 2: Write fuzzy product finder**

```javascript
// Append to src/utils/productMatching.js
export function fuzzyMatchProduct(ocrName, products) {
  if (!ocrName || products.length === 0) return null;

  const normalized = normalize(ocrName);
  let bestProduct = null;
  let bestDistance = Infinity;

  for (const product of products) {
    const productNorm = normalize(product.name);
    const dist = levenshtein(normalized, productNorm);
    const threshold = Math.max(
      2,
      Math.floor(Math.max(normalized.length, productNorm.length) * 0.15)
    );

    if (dist <= threshold && dist < bestDistance) {
      bestDistance = dist;
      bestProduct = product;
    }
  }

  return bestProduct;
}
```

- [ ] **Step 3: Write batch matching for OCR results**

```javascript
// Append to src/utils/productMatching.js
export function matchOCRItemsToProducts(ocrItems, products) {
  // ocrItems: [{ name, price }, ...]
  // returns: [{ product, ocrPrice, matched: bool }, ...]

  return ocrItems.map((item) => {
    const product = fuzzyMatchProduct(item.name, products);
    return {
      product,
      ocrName: item.name,
      ocrPrice: item.price,
      matched: !!product,
    };
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/productMatching.js
git commit -m "feat: add fuzzy product matching for OCR results"
```

---

## Phase 3: HomeScreen Integration

### Task 7: Update HomeScreen to Use Supabase Data

**Files:**
- Modify: `src/screens/HomeScreen.js:1-50` (imports and data fetching)

**Context:** Replace `SAMPLE_DATA` constant with real Supabase queries. Keep all filtering/sorting logic the same.

- [ ] **Step 1: Read current HomeScreen**

```bash
head -50 /Users/erlend_samset/Kode\ prosjekter-----/MatbutikkPriserApp/matpris/src/screens/HomeScreen.js
```

Expected: Imports, state, useEffect, SAMPLE_DATA reference

- [ ] **Step 2: Update imports**

Find this:
```javascript
// (existing imports)
import { COLORS, STORES } from "../utils/constants";
```

Replace with:
```javascript
import { COLORS, STORES } from "../utils/constants";
import { getProducts, getPrices } from "../utils/database";
```

- [ ] **Step 3: Add state for products and prices**

In the component function, find `const [searchQuery, setSearchQuery] = useState("");` and add after it:

```javascript
const [products, setProducts] = useState([]);
const [prices, setPrices] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

- [ ] **Step 4: Add useEffect to fetch data**

Find the existing useEffect (if any) or add one at the top of the component:

```javascript
useEffect(() => {
  let isMounted = true;

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      const [productsData, pricesData] = await Promise.all([
        getProducts(),
        getPrices(),
      ]);

      if (!isMounted) return;

      // Transform prices into product.prices structure
      const pricesByProduct = {};
      for (const price of pricesData) {
        const productId = price.product_id;
        if (!pricesByProduct[productId]) {
          pricesByProduct[productId] = {};
        }
        pricesByProduct[productId][price.store_chain] =
          price.price;
      }

      // Merge prices into products
      const enriched = productsData.map((p) => ({
        ...p,
        prices: pricesByProduct[p.id] || {},
      }));

      setProducts(enriched);
      setPrices(pricesData);
    } catch (err) {
      if (isMounted) setError(err.message);
    } finally {
      if (isMounted) setLoading(false);
    }
  }

  fetchData();

  return () => {
    isMounted = false;
  };
}, [refreshKey]);
```

- [ ] **Step 5: Update rendering to use state instead of SAMPLE_DATA**

Find where the code renders product list (likely `getFilteredProducts(products, searchQuery, ...)`). Verify it's using the `products` state variable, not a constant.

If there's a line like:
```javascript
const filtered = getFilteredProducts({ products: SAMPLE_DATA, ...})
```

Change to:
```javascript
const filtered = getFilteredProducts({ products, ...})
```

- [ ] **Step 6: Add loading/error UI**

Add near the top of the render:

```javascript
if (loading) {
  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

if (error) {
  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={styles.errorText}>Feil ved lasting av produkter: {error}</Text>
    </View>
  );
}
```

(Add `ActivityIndicator` to React Native imports if not present)

- [ ] **Step 7: Test locally**

```bash
npx expo start
# Open in Expo Go on iOS simulator or device
# Navigate to HomeScreen, verify products load and filter works
```

Expected: Real products from Supabase, searchable and filterable

- [ ] **Step 8: Commit**

```bash
git add src/screens/HomeScreen.js
git commit -m "feat: replace HomeScreen sample data with Supabase queries"
```

---

## Phase 4: ScanScreen Auth Guard & Integration

### Task 8: Add Auth Guard to ScanScreen

**Files:**
- Modify: `src/screens/ScanScreen.js:55-100` (component entry point)

**Context:** Before allowing a user to scan, check if they're authenticated. If not, show a button to go to LoginScreen.

- [ ] **Step 1: Add navigation prop to ScanScreen**

ScanScreen is called from App.js. Ensure it receives `onGoToLogin` prop:

In `App.js`, find where `<ScanScreen ... />` is rendered and add:

```javascript
<ScanScreen onGoToLogin={() => setScreen("login")} ... />
```

(or similar navigation method if already in place)

- [ ] **Step 2: Add session check to ScanScreen**

At the top of the ScanScreen component, add:

```javascript
export default function ScanScreen({ onGoToLogin, onGoBack, onScanComplete }) {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  // ... existing state ...

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(data.session);
          setSessionLoading(false);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        if (isMounted) setSessionLoading(false);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);
```

- [ ] **Step 3: Add UI to prompt login**

In the render, check at the very top:

```javascript
if (sessionLoading) {
  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

if (!session) {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text, marginBottom: 16, textAlign: "center" }}>
          Logg inn for å skanne kvitteringer
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.accent, paddingVertical: 12 }]}
          onPress={onGoToLogin}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Logg inn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Rest of existing ScanScreen UI ...
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/ScanScreen.js
git commit -m "feat: add auth guard to ScanScreen (redirect to login if not authenticated)"
```

### Task 9: Wire Image Upload to ScanScreen

**Files:**
- Modify: `src/screens/ScanScreen.js:125-180` (handleSubmit function)

**Context:** After OCR succeeds, compress and upload the image before saving prices.

- [ ] **Step 1: Add imports to ScanScreen**

Add at top of file:

```javascript
import { compressImage, uploadReceiptImage } from "../utils/imageUtils";
```

- [ ] **Step 2: Find handleSubmit in ScanScreen**

Locate the function that handles submission (around line 127 based on earlier read).

- [ ] **Step 3: Update handleSubmit to upload image**

Find the section where `receipts` table is being inserted. Add image compression/upload before that:

```javascript
const handleSubmit = async () => {
  if (submitting) return;
  if (!selectedStore || items.length === 0) {
    setSubmitError("Mangler butikk eller varer å sende inn.");
    return;
  }

  setSubmitting(true);
  setSubmitError(null);
  setStep(3); // Show completion screen

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error("Klarte ikke å hente bruker.");
    if (!user) {
      setSubmitError("Du må være innlogget for å skanne.");
      return;
    }

    // NEW: Compress and upload image
    let imageUrl = null;
    if (photo) {
      const compressed = await compressImage(photo, 0.7);
      imageUrl = await uploadReceiptImage(user.id, compressed);
    }

    // Create receipt record
    const { data: receiptData, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        store_chain: selectedStore,
        image_url: imageUrl,
        ocr_raw_text: items.map((i) => `${i.name} ${i.price}`).join("\n"),
        item_count: items.length,
        status: "processed",
      })
      .select();

    if (receiptError) throw receiptError;

    // Continue with existing logic to insert prices...
  } catch (e) {
    setSubmitError(`Feil: ${e.message}`);
  } finally {
    setSubmitting(false);
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/ScanScreen.js
git commit -m "feat: add image compression and upload to ScanScreen"
```

### Task 10: Integrate Product Matching and Database Insert

**Files:**
- Modify: `src/screens/ScanScreen.js:150-220` (price matching and insertion)

**Context:** Match OCR items to products, show UI for user to confirm, then insert prices into database.

- [ ] **Step 1: Add imports to ScanScreen**

Add at top:

```javascript
import { matchOCRItemsToProducts } from "../utils/productMatching";
import { getProducts, insertPrices } from "../utils/database";
```

- [ ] **Step 2: Update state to track matched products**

Add to component state:

```javascript
const [matchedItems, setMatchedItems] = useState([]);
const [allProducts, setAllProducts] = useState([]);
```

- [ ] **Step 3: Add useEffect to load products**

Add after session check useEffect:

```javascript
useEffect(() => {
  let isMounted = true;

  async function loadProducts() {
    try {
      const products = await getProducts();
      if (isMounted) setAllProducts(products);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }

  loadProducts();

  return () => {
    isMounted = false;
  };
}, []);
```

- [ ] **Step 4: Match items after OCR**

In the `handleTakePhoto` or wherever OCR results are received, add:

```javascript
const handleTakePhoto = async () => {
  if (!cameraRef.current) return;
  setLoadingOCR(true);
  try {
    const snap = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    const uri = snap.uri;
    setPhoto(uri);
    setOcrError(null);
    
    const parsed = await runOCR(uri);
    if (!parsed?.length) {
      setOcrError("Fant ingen varer i bildet. Prøv et tydeligere bilde eller et annet utsnitt.");
      return;
    }
    
    setItems(parsed);
    
    // NEW: Match items to products
    const matched = matchOCRItemsToProducts(parsed, allProducts);
    setMatchedItems(matched);
    
    setStep(1);
  } catch (e) {
    setOcrError(`Feil: ${e.message}`);
  } finally {
    setLoadingOCR(false);
  }
};
```

Do the same for `handlePickFromGallery`.

- [ ] **Step 5: Show matched products to user (Step 2 UI)**

In the render, when `step === 2` (review items), display matched products with ability to correct:

```javascript
// In render function, add this when step === 2:
if (step === 2) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Bekreft varene</Text>
      {matchedItems.map((item, idx) => (
        <View key={idx} style={[styles.card, { marginBottom: 12 }]}>
          <Text style={styles.itemName}>
            {item.product?.name || item.ocrName}
          </Text>
          <Text style={styles.itemPrice}>{item.ocrPrice} kr</Text>
          {!item.matched && (
            <Text style={{ color: COLORS.danger, fontSize: 12 }}>
              Ikke samsvarende — velg manuelt
            </Text>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
        <Text style={styles.buttonText}>Neste: Velg butikk</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

- [ ] **Step 6: Insert prices into database**

In `handleSubmit`, after receipt is created, add prices insertion:

```javascript
// After receipt is created
const priceRecords = matchedItems
  .filter((item) => item.matched) // Only insert matched items
  .map((item) => ({
    product_id: item.product.id,
    store_chain: selectedStore,
    price: item.ocrPrice,
    quantity: 1, // Default; user can correct later
    receipt_date: new Date().toISOString().split("T")[0],
  }));

if (priceRecords.length > 0) {
  const inserted = await insertPrices(user.id, priceRecords);
  console.log(`Inserted ${inserted.length} prices`);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/screens/ScanScreen.js
git commit -m "feat: integrate product matching and price insertion into ScanScreen"
```

---

## Phase 5: Testing & Polish

### Task 11: End-to-End Testing

**Files:**
- None (manual testing)

**Context:** Test full flow: browse → login → scan → see new prices.

- [ ] **Step 1: Clear local data (start fresh)**

```bash
npx expo start
```

- [ ] **Step 2: Test HomeScreen loads**

- Open app
- Verify HomeScreen shows products from Supabase (not SAMPLE_DATA)
- Test search, filter, sorting
- Expected: Real data visible, no errors

- [ ] **Step 3: Test scan requires login**

- Tap "Scan Receipt"
- Expected: Redirected to LoginScreen (not camera)

- [ ] **Step 4: Create test account and login**

- In LoginScreen, register with test email (e.g., `test@matpris.no`)
- Verify email (check Supabase Auth in dashboard or skip if you set auto-confirm)
- Login
- Expected: Redirected back to ScanScreen

- [ ] **Step 5: Take a test photo and verify OCR**

- Tap "Scan Receipt" → "Take Photo"
- Use a real receipt or a photo of one
- Wait for OCR to complete
- Expected: Items extracted, matched to products

- [ ] **Step 6: Confirm and submit**

- Review matched items
- Select store
- Tap "Submit"
- Expected: Image compressed, uploaded to Storage, receipt created, prices inserted, return to HomeScreen

- [ ] **Step 7: Verify new prices appear**

- Return to HomeScreen
- Search for a product you just scanned
- Expected: New price visible under the store you selected

- [ ] **Step 8: Log out and verify public access still works**

- Logout (ProfileScreen or App.js)
- Return to HomeScreen
- Expected: Can still browse and search without login

- [ ] **Step 9: Test error cases**

- Invalid receipts (blank photos, unreadable text)
- Network errors (disable internet, try to submit)
- Login/auth failures
- Expected: Graceful error messages, no crashes

### Task 12: Error Handling & Loading States

**Files:**
- Modify: `src/screens/ScanScreen.js:*` (throughout)

**Context:** Add user feedback for slow operations and failures.

- [ ] **Step 1: Add loading indicators**

In ScanScreen, during image upload:

```javascript
const [uploadingImage, setUploadingImage] = useState(false);

// In handleSubmit, wrap upload:
setUploadingImage(true);
const compressed = await compressImage(photo, 0.7);
const imageUrl = await uploadReceiptImage(user.id, compressed);
setUploadingImage(false);
```

Show in UI:
```javascript
if (uploadingImage) {
  return (
    <View style={[styles.container, { justifyContent: "center" }]}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={{ marginTop: 16, textAlign: "center" }}>Laster opp kvittering...</Text>
    </View>
  );
}
```

- [ ] **Step 2: Improve error messages**

Replace generic "Feil:" with specific messages:

```javascript
catch (e) {
  if (e.message.includes("Network")) {
    setSubmitError("Nettverksfeil. Sjekk internetttilkoblingen og prøv igjen.");
  } else if (e.message.includes("Image upload")) {
    setSubmitError("Klarte ikke å laste opp bildet. Prøv igjen.");
  } else {
    setSubmitError(e.message);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/ScanScreen.js
git commit -m "feat: add loading states and improved error messages"
```

### Task 13: Performance & Polish

**Files:**
- Modify: `src/screens/HomeScreen.js`, `src/screens/ScanScreen.js`

**Context:** Optimize image sizes, add pull-to-refresh, verify performance.

- [ ] **Step 1: Verify image compression quality**

Test that 0.7 quality in `compressImage` looks acceptable. If too blurry, increase to 0.8:

```javascript
const compressed = await compressImage(photo, 0.8); // or keep 0.7
```

- [ ] **Step 2: Add pull-to-refresh to HomeScreen (optional)**

If using FlatList/ScrollView, add:

```javascript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={loading}
      onRefresh={async () => {
        setLoading(true);
        // Re-fetch data
      }}
    />
  }
>
```

- [ ] **Step 3: Test on slow network**

Use Xcode Network Link Conditioner or Expo DevTools to simulate slow 3G:
- Verify OCR timeout doesn't hang (should have timeout after ~30s)
- Verify image upload shows progress

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.js src/screens/ScanScreen.js
git commit -m "feat: optimize images and add performance polish"
```

---

## Summary

**Total tasks:** 13  
**Estimated effort:** 8–12 focused development days  
**Key deliverables:**
- ✅ Supabase schema (products, prices, receipts)
- ✅ HomeScreen pulls real data
- ✅ ScanScreen requires login
- ✅ Image upload to Storage
- ✅ Product matching and price insertion
- ✅ End-to-end scanning flow working
- ✅ App ready for iOS App Store submission

**Next after implementation:**
- Privacy policy + Terms (legal requirement for App Store)
- App metadata (screenshots, description)
- TestFlight beta (internal testing)
- App Store submission

---

## Spec Coverage Check

| Spec Section | Implementation Task |
|--------------|-------------------|
| Supabase Schema (products, prices, receipts) | Task 1-3 |
| User Flow (browse → scan → submit) | Tasks 7-10 |
| Auth (browse anonymous, scan authenticated) | Task 8 |
| Image Upload & Storage | Task 9 |
| Product Matching | Task 10 |
| Error Handling | Task 12 |
| Testing | Task 11 |
| Performance | Task 13 |

✅ All spec requirements covered.
