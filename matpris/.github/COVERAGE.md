# Test Coverage Rapport

**Sist oppdatert:** 2026-04-27
**Test Suite:** 8 filer, 58 tester
**Alle tester:** ✅ PASSERT

## Coverage-oversikt

### Totalt coverage
- **Statements:** 89.67%
- **Branches:** 86.41%
- **Functions:** 85.18%
- **Lines:** 91.13%

### Per fil/mappe

#### `src/components` — 🟢 Eksemplarisk (96.96% statements)
| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| BottomNav.js | 100% | 100% | 100% | 100% |
| ProductCard.js | 100% | 100% | 100% | 100% |
| StoreFilter.js | 100% | 100% | 100% | 100% |
| ProductDetail.js | 92.3% | 100% | 75% | 90.9% |
| **Average** | **96.96%** | **100%** | **91.66%** | **96.77%** |

#### `src/utils` — 🟢 Høyt dekket (91.08% statements)
| File | Statements | Branches | Functions | Lines | Notes |
|------|-----------|----------|-----------|-------|-------|
| constants.js | 100% | 100% | 100% | 100% | Bare konstanter |
| helpers.js | 100% | 80.76% | 100% | 100% | Alle hovedfunksjoner testet |
| ocr.js | 89.85% | 84.33% | 90.9% | 90.29% | parseReceiptText dekket; Google Vision ukjent |

#### `src/screens` — 🟢 Høyt dekket (91.23% statements)
| File | Statements | Branches | Functions | Lines | Årsak til lavt coverage |
|------|-----------|----------|-----------|-------|-------------------------|
| HomeScreen.js | 83.78% | 88.88% | 80% | 85.71% | Lite kompleks UI-logikk |
| ScanScreen.js | 92.99% | 85.54% | 92.3% | 94.85% | Enkeltgrenser igjen i feilflyt og tilbakeknapper |

## Testpyramiden

```
      🔺
     ╱ ╲         E2E (3)
    ╱───╲       ─────────
   ╱     ╲      Integration (13)
  ╱───────╲    ──────────────────
 ╱         ╲   Unit (36)
╱───────────╲  ──────────────────────────
```

- **Unit tests (36):** `helpers.test.js` (11) + `ocr.unit.test.js` (13)
- **Integration (19):** Component/screen interaction tests
- **E2E (3):** Full app auth-flow tests

## Dekkingshull og hvorfor

### Gjenværende hull i App.js (71.42%)
**Årsak:** Navigasjon via ScrollView (`navigateTo`, `handleScroll`) er kun delvis testet.
**Løsning:** Legg til målrettede tester som trigger scroll-event og scan-complete-callback.

### Gjenværende hull i HomeScreen (83.78%)
**Årsak:** Feilhåndtering/lastetilfeller dekkes mindre enn happy path.
**Løsning:** Legg til tester for fallback ved tomme/sviktende kall.

## Coverage-mål

| Threshold | Current | Target |
|-----------|---------|--------|
| Statements | 89.67% | 85% ✅ |
| Branches | 86.41% | 80% ✅ |
| Functions | 85.18% | 80% ✅ |

Kjør `npm run test:ci` for å generere ny coverage-rapport.
