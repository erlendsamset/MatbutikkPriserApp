# Test Coverage Rapport

**Sist oppdatert:** 2026-04-26
**Test Suite:** 8 filer, 52 tester
**Alle tester:** ✅ PASSERT

## Coverage-oversikt

### Totalt coverage
- **Statements:** 67.13%
- **Branches:** 64.19%
- **Functions:** 64.19%
- **Lines:** 68.97%

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

#### `src/screens` — 🟡 Moderat dekket (41.75% statements)
| File | Statements | Branches | Functions | Lines | Årsak til lavt coverage |
|------|-----------|----------|-----------|-------|-------------------------|
| HomeScreen.js | 83.78% | 88.88% | 80% | 85.71% | Lite kompleks UI-logikk |
| ScanScreen.js | 31.84% | 20.48% | 26.92% | 36.02% | Mye kompleks 4-steg-flow + kamera/OCR mocking |

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
- **Integration (13):** Component/screen interaction tests
- **E2E (3):** Full app auth-flow tests

## Dekkingshull og hvorfor

### Lav coverage i ScanScreen (31.84%)
**Årsak:** 4-step flow med kamera, OCR, og komplekst state-management.
**Løsning:** Fokusert på testing av brukerlens-interaksjoner (knapper, flows).

## Coverage-mål

| Threshold | Current | Target |
|-----------|---------|--------|
| Statements | 67.13% | 70% |
| Branches | 64.19% | 68% |
| Functions | 64.19% | 70% |

Kjør `npm run test:ci` for å generere ny coverage-rapport.
