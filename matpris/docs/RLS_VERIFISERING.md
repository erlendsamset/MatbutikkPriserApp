# RLS-verifisering (Supabase)

Målet er å bekrefte at tilgang er trygg før launch.

## 1) Kjør policy-filen

1. Åpne Supabase -> SQL Editor
2. Kjør [supabase/rls_policies.sql](../supabase/rls_policies.sql)

## 2) Lag to testbrukere

- Bruker A (email A)
- Bruker B (email B)

Logg inn med hver av dem i appen (eller via SQL + JWT klienttest).

## 3) Forventet oppførsel

1. `products` og `prices`:
   - A kan lese
   - B kan lese

2. `receipts`:
   - A kan kun lese/opprette/oppdatere/slette egne receipts
   - B kan ikke lese A sine receipts

3. `prices` write:
   - A kan kun skrive prices koblet til receipt som eies av A
   - B kan ikke skrive mot A sin receipt

4. `users`:
   - A ser kun egen profilrad
   - B ser kun egen profilrad

## 4) SQL-sjekker (enkle)

Kjør som innlogget bruker A:

```sql
select count(*) from public.receipts;
```

Forventning: kun A sine rader.

Forsøk å opprette price med receipt_id som tilhører B:

```sql
insert into public.prices (product_id, receipt_id, store, price)
values ('<product_id>', '<receipt_id_tilhører_B>', 'kiwi', 10.50);
```

Forventning: feiler med RLS.

## 5) Kjente antakelser i policy-filen

- `users.auth_id` matcher `auth.uid()`
- `receipts.user_id` matcher `auth.uid()`
- `prices.receipt_id` peker til `receipts.id`

Hvis tabellfeltene dine heter noe annet, juster policyene tilsvarende.
