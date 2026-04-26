# Testing og CI/CD

## Lokalt testing

### Kjør alle tester
```bash
npm test
```

### Kjør tester i watch-modus
```bash
npm run test:watch
```

### Kjør tester med coverage-rapport
```bash
npm run test:ci
```

## GitHub Actions (Continuous Integration)

Testene kjøres automatisk:
- **Push til `main` eller `develop`** – alle tester kjøres
- **Pull Request** – alle tester kjøres før merge tillates

### Workflow-fil
Workflow-konfigurasjonen ligger i `.github/workflows/test.yml` og:
1. Setter opp Node.js 18.x miljø
2. Installerer dependencies via npm cache
3. Kjører `npm run test:ci` (alle 45 tester med coverage)
4. Laster opp coverage-rapport til Codecov (valgfritt)

## Pre-commit hooks (lokalt)

Før en commit tillates lokalt, kjøres:
1. **Secrets-sjekk** – sikrer at ingen API-nøkler commites
2. **Test-kjøring** – hvis test- eller kildekoder endres, kjøres testene

Hvis tester feiler, blockeres commiten. Kjør `npm run test:ci` for detaljer.

## Test-pyramiden

Testene følger test-pyramide-prinsippet:
- **Unit tests (24)** – `__tests__/unit/`
- **Integration tests (18)** – `__tests__/integration/`
- **E2E tests (3)** – `__tests__/app-flow/`

Totalt **45 tester** som kjøres på hvert push/PR.

## Coverage

Coverage-rapporten vises etter `npm run test:ci`:
```
File                    | % Stmts | % Branch | % Funcs | % Lines
All files               |    66.9 |    63.37 |   62.96 |   68.69
```

Høyeste coverage på komponent- og utility-filer (90%+), lavere på skjermene (30-85%) siden de har komplekst UI-logikk som testes via integration/E2E tester.
