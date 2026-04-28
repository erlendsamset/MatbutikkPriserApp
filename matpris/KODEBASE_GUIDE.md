# Kodebase-guide (Matpris)

Denne guiden er laget for at du skal kunne forstå hele kodebasen raskt og systematisk.

## 1) Mental modell først

Appen har tre hovedstrømmer:

1. Auth-gate: `App.js` bestemmer om bruker ser `LoginScreen` eller hovedappen.
2. Lesestrøm (priser): `HomeScreen` og `TilbudScreen` leser fra `prices` + `products`.
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
9. `src/screens/TilbudScreen.js`
10. `src/screens/ScanScreen.js`
11. `src/utils/ocr.js`
12. `src/screens/ProfileScreen.js`
13. `src/screens/LoginScreen.js`
14. `src/components/BottomNav.js`
15. tester i `__tests__/` for å se forventet oppførsel

## 3) Fil for fil – hva den gjør

### App-rot

- `App.js`
  - Holder global UI-state: `screen`, `daysLeft`, `totalScans`, `session`, `refreshKey`.
  - Lytter på Supabase auth state.
  - Pager mellom fire skjermer: `home`, `deals`, `scan`, `profile`.
  - `handleScanComplete()` er viktig: øker skanneteller og trigger refresh på Home.

### Utils

- `src/utils/constants.js`
  - Felles design-token + butikkmetadata.
  - Grunnlaget for konsistent farger/UI.

- `src/utils/supabase.js`
  - Oppretter én delt Supabase-klient.
  - Persisted auth-session via `expo-secure-store`.

- `src/utils/helpers.js`
  - Ren domenelogikk:
  - `getCheapestStore(product)`
  - `getFilteredProducts(...)`
  - `formatPrice(price)`
  - `getStoreInfo(storeKey)`

- `src/utils/ocr.js`
  - `runOCR(imageUri)`: sender bilde til Google Vision.
  - `parseReceiptText(text)`: parser kvitteringstekst til `{ name, price }[]`.
  - Flere fallback-formater er årsaken til at filen er relativt kompleks.

### Skjermer

- `src/screens/HomeScreen.js`
  - Leser priser fra Supabase.
  - Mapper rad-data til produktstruktur med `prices`-objekt per produkt.
  - Søk/filter/sort bruker `helpers.js`.
  - Åpner `ProductDetail` modal ved trykk.

- `src/screens/TilbudScreen.js`
  - Leser samme rådata som Home.
  - Regner min/max/saving per produkt.
  - Viser toppliste over størst prisforskjell.

- `src/screens/ScanScreen.js`
  - 4 steg: kamera -> butikkvalg -> bekreft -> resultat.
  - OCR + aliasmatching (eksakt + fuzzy) -> eventuelt opprett nytt produkt.
  - Skriver til `receipts`, `product_aliases`, `products`, `prices`.
  - Henter sammenligningsgrunnlag og viser potensiell besparelse.
  - Dette er den mest forretningskritiske filen.

- `src/screens/ProfileScreen.js`
  - Viser tilgangsstatus og skannetall fra props.
  - Foreløpig presentasjonslag uten databasekall.

- `src/screens/LoginScreen.js`
  - Login/register mot Supabase Auth.
  - Ved suksess oppdaterer auth-listener i `App.js` session.

### Komponenter

- `src/components/BottomNav.js`: enkel fanevelger.
- `src/components/StoreFilter.js`: horisontal butikk-chip-filter.
- `src/components/ProductCard.js`: én rad i produktlisten.
- `src/components/ProductDetail.js`: modal med sortert prisliste.

## 4) Dataformer du bør kunne utenat

### Produkt i UI

```js
{
  id: "uuid",
  name: "Tine Helmelk 1L",
  category: "Meieri",
  prices: {
    rema: 22.9,
    kiwi: 21.5
  }
}
```

### OCR-resultat i Scan-flyt

```js
[{ name: "Banan", price: 12.9 }]
```

## 5) Viktigste flyter å følge i kode

1. Innlogging:
   `LoginScreen` -> `supabase.auth.signInWithPassword` -> auth callback i `App.js`.

2. Henting av produkter:
   `HomeScreen.fetchProducts()` -> `supabase.from("prices").select(...)` -> map/group -> render.

3. Skanning og lagring:
   `ScanScreen.handleTakePhoto()` -> `runOCR()` -> `handleSubmit()` -> Supabase writes.

## 6) Hvor kompleksiteten faktisk ligger

- Høy: `ScanScreen.js`, `ocr.js`
- Medium: `HomeScreen.js`, `TilbudScreen.js`
- Lav: `ProfileScreen.js`, `BottomNav.js`, `StoreFilter.js`

Fokuser mest tid på høy-kompleksitetsfiler.

## 7) Testene – hva de beskytter

- `__tests__/unit/helpers.test.js`: filtrering/sortering/prisformattering.
- `__tests__/unit/ocr.unit.test.js`: parserregler og kvitteringsformater.
- `__tests__/integration/*.test.js`: skjerm- og komponentinteraksjon.
- `__tests__/app-flow/App.flow.test.js`: auth-gating på appnivå.

Når du lurer på “hva skal koden gjøre?”, sjekk testen først.

## 8) Kodebasens nåværende grenser

- Ikke full backend-integrasjon overalt (f.eks. profil er fortsatt props-basert).
- OCR er implementert, men kvalitet avhenger av kvitteringstype og råtekst.
- Ingen offline-cache implementert ennå.

## 9) Forslag til “neste forståelsessteg” etter i kveld

1. Tegn egen sekvens for `ScanScreen.handleSubmit`.
2. Skriv ned alle tabeller som brukes aktivt i kode akkurat nå.
3. Kjør testene og åpne én testfil per hovedstrøm.
