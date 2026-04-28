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
- Når valgt butikk overstyrer “billigst”.

Mål: Du skal kunne følge én vare fra database-rad til UI.

## Del 3 (25 min): Tilbudsstrøm

1. Les `src/screens/TilbudScreen.js`

Fokuspunkter:
- Beregning av `minPrice`, `maxPrice`, `saving`.
- Hvorfor skjermen er egen, selv om rådata er lik Home.

Mål: Du skal kunne forklare hvordan “spar X kr” beregnes.

## Del 4 (60 min): Skannestrøm (viktigst)

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

## Del 5 (20 min): Auth + profil

1. Les `src/screens/LoginScreen.js`
2. Les `src/screens/ProfileScreen.js`
3. Les `src/utils/supabase.js`

Mål: Du skal vite hvor session settes og hvor den brukes.

## Del 6 (20 min): Tester som “fasit”

Les i denne rekkefølgen:
1. `__tests__/app-flow/App.flow.test.js`
2. `__tests__/integration/HomeScreen.integration.test.js`
3. `__tests__/integration/ScanScreen.integration.test.js`
4. `__tests__/unit/ocr.unit.test.js`

Mål: Du skal se forventet oppførsel svart på hvitt.

## Avslutning (10 min): Egen oppsummering

Skriv korte svar på disse:
1. Hvilken fil er mest kritisk for datakvalitet?
2. Hvilken fil er mest kritisk for brukeropplevelse?
3. Hvilke 2 steder ville du lagt inn logging først ved feil?
4. Hvilken del av flyten er mest sårbar for edge cases?

Hvis du kan svare tydelig på disse, har du god kontroll på kodebasen.
