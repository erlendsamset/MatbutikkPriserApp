# Kveldsplan for å forstå hele kodebasen

Denne planen er laget for én kveld (ca. 2.5–3 timer).

## Del 1 (20 min): Få oversikt

1. Les `KODEBASE_GUIDE.md` raskt.
2. Åpne `App.js` og identifiser:
   - hvilke skjermer som rendres
   - hvilke props som flyter ned
   - hva som trigger data refresh

Mål: Du skal kunne forklare appens hovedflyt uten å se i koden.

## Del 2 (35 min): Lesestrøm (visning av priser)

1. Les `src/screens/HomeScreen.js`
2. Les `src/components/ProductCard.js`
3. Les `src/components/ProductDetail.js`
4. Les `src/utils/helpers.js`

Fokuspunkter:
- Hvordan Supabase-resultat formes til `products`.
- Hvordan søk/filter/sortering gjøres i `getFilteredProducts`.
- Når valgt butikk overstyrer "billigst".

Mål: Du skal kunne følge én vare fra database-rad til UI.

## Del 3 (60 min): Skannestrøm (viktigst)

1. Les `src/screens/ScanScreen.js`
2. Les `src/utils/ocr.js`

Fokuspunkter:
- De 4 stegene (`step` state).
- `handleTakePhoto` -> OCR -> `items`.
- `handleSubmit`:
  - auth-sjekk
  - receipt insert
  - alias map + fuzzy match
  - product create fallback
  - prices insert
- `fetchStoreTotals` og hvordan sammenligning bygges.

Mål: Du skal kunne tegne hele flyten fra bilde til lagret prisrad.

## Del 4 (20 min): Auth + profil

1. Les `src/screens/LoginScreen.js`
2. Les `src/screens/ProfileScreen.js`

Fokuspunkter:
- Hvordan Supabase auth hooks opp.
- Hvor `daysLeft` kommer fra og hvordan det re-synces etter scan.

Mål: Du skal forstå auth-gaten og brukernivå-data.

## Del 5 (10 min): Navigation + utils

1. Les `src/components/BottomNav.js`
2. Skim `src/utils/constants.js` (design tokens, eksempeldata)
3. Skim `src/utils/supabase.js` (client setup)

Mål: Du skjønner hele systemet nå 🎉
