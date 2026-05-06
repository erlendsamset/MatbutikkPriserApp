# Diagnose av kvitteringsskanning

Målet er at brukeren bare skal ta bilde, kontrollere varer og sende inn. Diagnose bør derfor skje i bakgrunnen og i utviklingsverktøy, ikke gjennom tekniske valg i vanlig UI.

## Del opp feilen i fire lag

1. Bilde: kamera, galleri, lys, fokus og om hele kvitteringen er synlig.
2. OCR: Google Vision returnerer rå tekst.
3. Parsing: `parseReceiptText()` gjør rå tekst om til `{ name, price }`.
4. Lagring: Supabase lagrer `receipts`, `products`, `product_aliases` og `prices`.

Når scanning feiler, finn først hvilket lag som feiler. Ikke start med å endre parseren før rå OCR-tekst og Supabase-feil er kjent.

## Rask diagnose i appen

Kjør appen i dev-modus og se konsollen:

```sh
npm start
```

Ved scanning logger `src/utils/ocr.js` rå OCR-tekst:

```text
=== OCR RAW TEXT ===
...
===================
```

Ved Supabase-feil logger `src/screens/ScanScreen.js` nå:

```text
[scan:supabase] {
  message,
  code,
  details,
  hint
}
```

Dette er viktig fordi brukeren kan få "Klarte ikke å lagre priser", mens den tekniske årsaken kan være RLS, manglende kolonne eller feil tabellskjema.

## Sannsynlig feil akkurat nå

Det er tegn til skjema-mismatch mellom kode, RLS-policy og migrasjon:

- `ScanScreen.js` oppretter receipt med `chain` og `total_amount`.
- `supabase/migrations/001_initial_schema.sql` definerer receipt med `store_chain`, men ikke `chain` eller `total_amount`.
- `rls_policies.sql` forventer at `prices.receipt_id` finnes og peker til `receipts.id`.
- `ScanScreen.js` la tidligere inn prices uten `receipt_id`; dette er nå rettet i appkoden.
- `001_initial_schema.sql` definerer `prices` med `store_chain`, `receipt_date` og `user_id`, mens appen/RLS bruker `store` og `receipt_id`.
- `product_aliases` brukes av appen og RLS, men finnes ikke i `001_initial_schema.sql`.

Hvis databasen ble laget fra `001_initial_schema.sql`, vil innsending etter OCR sannsynligvis feile selv om OCR/parsing fungerer.

## SQL for å sjekke faktisk Supabase-skjema

Kjør dette i Supabase SQL Editor:

```sql
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('receipts', 'prices', 'products', 'product_aliases')
order by table_name, ordinal_position;
```

For appkoden slik den er nå bør du minst ha:

```text
receipts: id, user_id, chain, scanned_at, item_count, total_amount, status
prices: id, product_id, receipt_id, store, price
products: id, name
product_aliases: id, product_id, alias, store
```

## Praktisk testflyt

1. Scan en tydelig kvittering fra galleri først. Det gir repeterbar test.
2. Kopier rå OCR-tekst fra konsollen.
3. Legg råteksten inn i en unit-test for `parseReceiptText`.
4. Hvis parseren gir riktig vareliste, test Supabase-lagring.
5. Hvis Supabase feiler, bruk `[scan:supabase]`-loggen og skjema-spørringen over.

## Hva som gjør scanning enklest for ikke-tekniske brukere

Brukeren bør aldri måtte forstå OCR. Appen bør vise:

- bildeutsnittet som ble lest
- vareliste med enkle redigerbare rader
- tydelig knapp for "Legg til vare" og "Fjern"
- markering av usikre linjer, for eksempel "Sjekk pris"
- automatisk butikkforslag fra OCR-tekst, men med manuell overstyring
- mulighet til å sende inn selv om noen varer slettes

For utvikling bør hver scanning lagre en diagnosepakke: bilde-URI eller storage path, rå OCR-tekst, parser-resultat, butikkvalg, bruker-id, Supabase-feil og appversjon. Den kan ligge i en egen `scan_debug_events`-tabell som bare utviklere/admin kan lese.
