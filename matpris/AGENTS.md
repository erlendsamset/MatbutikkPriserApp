# AGENTS.md — Prosjektkontekst for Matpris-appen

## Hva er dette?
En crowdsourcet prissammenlignings-app for dagligvarer i Norge. Brukere skanner kvitteringer med kameraet, appen leser varene og prisene via OCR, og legger dem inn i en felles database. For å ha tilgang til appen må man skanne minst 1 kvittering per måned.

## Tech Stack
- **Frontend:** React Native med Expo (blank template)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **OCR:** Planlagt: Google Cloud Vision API (ikke implementert ennå)
- **Språk:** JavaScript (ikke TypeScript)

## Mappestruktur
```
matpris/
├── App.js                          ← Hovedinngang, håndterer navigasjon mellom skjermer
├── AGENTS.md                       ← Denne filen
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js           ← Søk, filtrering, produktliste
│   │   ├── ScanScreen.js           ← Kvitteringsskanning (4 steg: kamera→butikk→bekreft→ferdig)
│   │   └── ProfileScreen.js        ← Brukerprofil, tilgangsstatus, skannehistorikk
│   ├── components/
│   │   ├── BottomNav.js            ← Bunnnavigasjon (Søk, Skann, Profil)
│   │   ├── ProductCard.js          ← Produktkort i listen
│   │   ├── ProductDetail.js        ← Modal med prissammenligning per butikk
│   │   └── StoreFilter.js          ← Horisontal butikkfilter (scrollbar)
│   └── utils/
│       ├── constants.js            ← Butikker, farger, kategorier, eksempeldata
│       └── helpers.js              ← getCheapestStore, getFilteredProducts, formatPrice
```

## Designsystem

### Farger (definert i constants.js COLORS)
- bg: "#FAFBF7" (bakgrunn)
- card: "#FFFFFF"
- text: "#1A2E1D" (hovedtekst)
- textSecondary: "#5A6350"
- textMuted: "#9CA38B"
- border: "#EFF1EA"
- accent: "#1A4023" (mørk grønn — primærfarge)
- accentLight: "#EFF5E5"
- success: "#6B9B1E" (grønn)
- warning: "#F7941E" (oransje)
- danger: "#C0392B" (rød)

### Butikker (definert i constants.js STORES)
Hver butikk har: name, color, bg (lysere bakgrunnsfarge)
- rema: Rema 1000 (#0060A9, blå)
- kiwi: Kiwi (#6B9B1E, grønn)
- coop_prix: Coop Prix (#E2001A, rød)
- coop_extra: Coop Extra (#E2001A, rød)
- meny: Meny (#C8102E, rød)
- bunnpris: Bunnpris (#F7941E, oransje)
- joker: Joker (#1B3668, mørk blå)
- spar: Spar (#007A3D, grønn)

### Stil
- Avrundede kort (borderRadius: 14)
- Subtile borders (#EFF1EA)
- Naturlig grønn fargepalett
- Norsk UI-tekst gjennomgående

## Databaseskjema (Supabase/PostgreSQL)
Ikke koblet til ennå — appen bruker SAMPLE_DATA i constants.js.

### Tabeller (planlagt):
- **users**: id, auth_id, display_name, last_scan_at, access_expires, total_scans, is_active
- **stores**: id, chain (enum), name, address, city, postal_code, lat, lng
- **categories**: id, name, icon
- **products**: id, name, brand, weight_volume, category_id, barcode, verified
- **product_aliases**: id, product_id, alias, source — for OCR-normalisering
- **receipts**: id, user_id, store_id, chain, receipt_date, scanned_at, image_url, ocr_raw_text, status, item_count, total_amount
- **prices**: id, product_id, store_id, chain, receipt_id, price, unit_price, quantity, observed_date
- **current_prices**: materialisert view — siste kjente pris per produkt per kjede
- **unmatched_items**: kø for OCR-resultater som ikke matcher noe produkt

### Nøkkelrelasjoner:
- En bruker har mange kvitteringer
- En kvittering har mange priser
- Et produkt har mange aliaser (OCR-varianter)
- Priser kobler produkt + butikkjede + kvittering

### Row Level Security:
- Alle kan lese priser og produkter (hele poenget med appen)
- Brukere kan kun opprette/endre egne kvitteringer
- Brukere kan kun se/endre sin egen profil

## Nåværende status
✅ Ferdig:
- Alle 3 skjermer fungerer med eksempeldata
- Søk med tekstfiltrering
- Butikkfilter (horisontal scrollbar)
- Kategorifilter
- Sortering (billigst/dyrest)
- Produktdetalj-modal med prissammenligning
- Skanne-flow (4 steg med mock-data)
- Profil med tilgangsstatus og skannehistorikk
- Bottom navigation

❌ Ikke implementert ennå:
- Supabase-tilkobling (auth, database, storage)
- Ekte kamera/OCR-integrasjon
- Push-varsler
- Prishistorikk-graf
- Handleliste-funksjon
- App Store-klargjøring

## Viktige regler
1. Alt UI-tekst skal være på norsk
2. Ikke bruk TypeScript — prosjektet er rent JavaScript
3. Behold det eksisterende designsystemet (farger, borderRadius, spacing)
4. Bruk StyleSheet.create() for styling, ikke inline styles
5. Eksempeldata ligger i constants.js — når Supabase kobles til, erstattes disse med ekte API-kall
6. Appen skal fungere offline med cached data (implementeres senere)

## Neste prioriterte oppgaver (i rekkefølge)
1. Sett opp Supabase-tilkobling (supabase client, auth)
2. Erstatt eksempeldata med ekte database-kall
3. Implementer kamera + OCR for kvitteringsskanning
4. Legg til prishistorikk-visning
5. Push-varsler for utløpende tilgang
