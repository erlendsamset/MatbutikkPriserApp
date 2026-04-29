# Kodebase-guide (Matpris)

Denne guiden er laget for at du skal kunne forstå hele kodebasen raskt og systematisk.

## 1) Mental modell først

Appen har tre hovedstrømmer:

1. Auth-gate: `App.js` bestemmer om bruker ser `LoginScreen` eller hovedappen.
2. Lesestrøm (priser): `HomeScreen` leser fra `prices` + `products`.
3. Skrivestrøm (skanning): `ScanScreen` tar bilde, kjører OCR, matcher produkter, lagrer priser.

Hvis du forstår disse tre, forstår du nesten hele systemet.

## 2) Leserekkefølge (anbefalt)

1. `App.js`
2. `src/utils/constants.js`
3. `src/utils/supabase.js`
4. `src/utils/helpers.js`
5. `src/screens/HomeScreen.js`
6. `src/components/ProductCard.js`
7. `src/components/ProductDetail.js`
8. `src/components/StoreFilter.js`
9. `src/screens/ScanScreen.js`
10. `src/utils/ocr.js`
11. `src/screens/ProfileScreen.js`
12. `src/screens/LoginScreen.js`
13. `src/components/BottomNav.js`
14. tester i `__tests__/` for å se forventet oppførsel

## 3) Fil for fil – hva den gjør

### App-rot

- `App.js`
  - Holder global UI-state: `screen`, `daysLeft`, `totalScans`, `session`, `refreshKey`.
  - Lytter på Supabase auth state.
  - Pager mellom tre skjermer: `home`, `scan`, `profile`.
  - `handleScanComplete()` er viktig: øker skanneteller og trigger refresh på Home.

### Utils

- `src/utils/constants.js`
  - Felles design-token + butikkmetadata.
  - Grunnlaget for konsistent farger/UI.

- `src/utils/supabase.js`
  - Oppretter én delt Supabase-klient.
  - Håndterer sikker session-lagring (expo-secure-store).

- `src/utils/helpers.js`
  - `getCheapestStore(prices)` — returnerer billigste butikk.
  - `getFilteredProducts(query, stores, category)` — tekstfiltrering.
  - `formatPrice(num)` — norsk format (eks: "12,50 kr").

### Screens

- `src/screens/HomeScreen.js`
  - Søk + filtrering + produktliste.
  - Kilder: `SAMPLE_DATA.products` + `SAMPLE_DATA.prices` (venter på Supabase).
  - `TouchableOpacity` på produktkort åpner `ProductDetail`-modal.
  - Props: `daysLeft`, `refreshKey` (for å rerender etter skanning).

- `src/screens/ScanScreen.js`
  - 4-step flow: Kamera → velg butikk → bekreft varer → ferdig-skjerm.
  - Bruker `react-native-camera` for bildetaking.
  - Kaller `ocr.parseReceipt()` for å parse tekst.
  - Matcher varer mot `SAMPLE_DATA.products`.
  - Når bruker trykker "Godta", kaller `onScanComplete()` callback til App.
  - Props: `onGoBack`, `totalScans`, `onScanComplete`.

- `src/screens/ProfileScreen.js`
  - Viser brukernavn, tilgangsstatus, skannehistorikk.
  - Dager igjen beregnes fra `daysLeft` prop.
  - Props: `daysLeft`, `totalScans`.

- `src/screens/LoginScreen.js`
  - Email + password input.
  - Kaller `supabase.auth.signInWithPassword()` og `signUp()`.
  - Viser feilmeldinger hvis login mislykkes.

### Components

- `src/components/BottomNav.js`
  - Tre faner: Søk, Skann, Profil.
  - Markerer aktiv fane med accent-farge.
  - Props: `activeScreen`, `onNavigate`.

- `src/components/ProductCard.js`
  - Viser produktnavn, merke, billigste pris + butikk.
  - Tar `product` + `prices` som props.
  - Touchable — åpner `ProductDetail`-modal.

- `src/components/ProductDetail.js`
  - Modal som viser alle prisene for ett produkt, sortert per butikk.
  - Beregner pris/kg eller pris/L hvis `unitPrice` finnes.
  - Props: `visible`, `product`, `prices`, `onClose`.

- `src/components/StoreFilter.js`
  - Horisontal ScrollView med butikkknapper.
  - Multi-select — user kan velge flere butikker.
  - Props: `selectedStores`, `onSelectStores`.

## 4) Dataflyt

### Lesestrøm (HomeScreen → detalj)

```
SAMPLE_DATA.products + SAMPLE_DATA.prices (fra constants.js)
  ↓
HomeScreen.js
  ├→ StoreFilter.js (brukeren velger butikker)
  ├→ TextInput (brukeren søker etter produkt)
  ├→ ProductCard.js (liste med produkter)
  └→ ProductDetail.js (klikk på produkt → modal med alle priser)
```

### Skrivestrøm (ScanScreen → database)

```
Bruker fotograferer kvittering
  ↓
ocr.js — Google Cloud Vision + parsing
  ↓
ScanScreen.js — bekreftelse
  ↓
supabase.from('prices').insert()
  ↓
App.js — refreshKey++ → HomeScreen re-render
```

## 5) Viktige mønstre

### State lifting

- Global state i `App.js`: `screen`, `session`, `daysLeft`, `refreshKey`.
- Props sendes ned til skjermer og komponenter.
- Callbacks sendes opp: `onNavigate`, `onScanComplete`, osv.

### OCR pipeline

Mottaker kvitteringsbilde → Cloud Vision → tekst → regex-parsing → brukerkonfirmasjon → database-insert.

Se `src/utils/ocr.js` for implementasjonen.

### ProductCard + ProductDetail

`ProductCard` brukes i HomeScreen-lista.
`ProductDetail` er en modal som åpnes når bruker trykker en ProductCard.
De deler samme `product` + `prices` data.

## 6) Testing-strategi

- Unit-tester: `__tests__/unit/` — tester isolert helpers, konstanter.
- Integration-tester: `__tests__/integration/` — tester flere komponenter sammen.
- Flow-tester: `__tests__/app-flow/` — tester hele apper-flows (login → scan → home).

Kjør tests med: `npm test`

## 7) Debugging tips

- **Staten din oppdateres ikke?** Sjekk at `refreshKey` endres etter scan — det trigget HomeScreen-rerender.
- **Produkter vises ikke?** Sjekk at `SAMPLE_DATA.products` og `SAMPLE_DATA.prices` fins i constants.js.
- **OCR-resultat er rart?** Test `ocr.parseReceipt()` med din kvitteringstekst i en test eller console.
- **Butikk-felter er tomme?** Sjekk at `STORES` i constants.js har både `name`, `color`, og `bg`.

## 8) API-er du vil bruke senere

- `supabase.auth.signInWithPassword()` — eksisterer allerede i LoginScreen.
- `supabase.from('products').select()` — kommer til å brukes når produktlisten skal hentes.
- `supabase.from('prices').insert()` — kommer til å brukes når skannet kvittering skal lagres.
- `supabase.from('receipts').insert()` — kommer til å brukes når kvitteringsmetadata skal lagres.
- `supabase.storage.from('receipts').upload()` — kommer til å brukes når bildet skal lagres.

## 9) Videre lesning

- Se `App.js` for hvordan skjermene pagineres.
- Se `src/screens/ScanScreen.js` for 4-step-flow-eksemplet.
- Se `src/utils/ocr.js` for hvordan OCR-parsing fungerer.
