# Matpris App — Steg-for-steg oppsett

## Forutsetninger (installer disse først)

### Steg 0.1 — Installer Node.js
1. Gå til https://nodejs.org
2. Last ned **LTS-versjonen** (den grønne knappen)
3. Kjør installeren, trykk "Next" hele veien
4. Verifiser at det fungerte: åpne Terminal og skriv:
   ```
   node --version
   ```
   Du skal se noe som `v20.x.x` eller `v22.x.x`

### Steg 0.2 — Installer VS Code
1. Gå til https://code.visualstudio.com
2. Last ned og installer
3. Åpne VS Code, gå til Extensions (⌘+Shift+X på Mac)
4. Søk etter og installer disse:
   - "ES7+ React/Redux/React-Native Snippets"
   - "Prettier - Code formatter"

### Steg 0.3 — Installer Xcode (kun Mac, for iPhone-simulator)
1. Åpne App Store på Mac
2. Søk "Xcode", klikk "Hent" (det er ~12 GB, tar litt tid)
3. Etter installasjon, åpne Xcode én gang og godta lisensen
4. Gå til Xcode → Settings → Platforms → last ned "iOS 17" simulator

### Steg 0.4 — Installer Expo Go på telefonen (valgfritt, for testing på ekte telefon)
1. Åpne App Store på iPhone
2. Søk "Expo Go" og installer

---

## Oppsett av prosjektet

### Steg 1 — Opprett Expo-prosjektet
Åpne Terminal (på Mac: Cmd+Space, skriv "Terminal") og kjør:

```bash
npx create-expo-app@latest matpris --template blank
```

Når den spør "Ok to proceed?" skriv `y` og trykk Enter.
Vent til den er ferdig (kan ta 1-2 minutter).

### Steg 2 — Gå inn i prosjektmappen
```bash
cd matpris
```

### Steg 3 — Installer ekstra pakker vi trenger
```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens
```

### Steg 4 — Kopier inn filene fra dette prosjektet
Kopier HELE `src`-mappen fra dette prosjektet inn i `matpris`-mappen.
Kopier også `App.js` og erstatt den eksisterende.

Mappestrukturen skal se slik ut:
```
matpris/
├── App.js                  ← erstatt den som allerede finnes
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── ScanScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   ├── ProductCard.js
│   │   ├── ProductDetail.js
│   │   ├── StoreFilter.js
│   │   └── BottomNav.js
│   └── utils/
│       ├── constants.js
│       └── helpers.js
├── package.json
└── ...
```

### Steg 5 — Åpne prosjektet i VS Code
```bash
code .
```
(Eller åpne VS Code manuelt og velg File → Open Folder → velg "matpris"-mappen)

### Steg 6 — Start appen
I VS Code, åpne terminalen (Ctrl+` eller Terminal → New Terminal) og kjør:

```bash
npx expo start
```

Du vil se en QR-kode og flere valg:
- Trykk `i` for å åpne i iPhone-simulator (krever Xcode)
- Skann QR-koden med Expo Go-appen på telefonen for å teste på ekte enhet
  (telefon og PC må være på samme WiFi-nettverk)

### Steg 7 — Se appen!
Appen skal nå vise seg i simulatoren eller på telefonen.
Hver gang du lagrer en fil i VS Code, oppdateres appen automatisk.

---

## Feilsøking

**"command not found: npx"**
→ Node.js er ikke installert riktig. Lukk Terminal, installer Node.js på nytt, åpne ny Terminal.

**"Unable to find Xcode"**
→ Åpne Xcode manuelt én gang og godta lisensen. Kjør `sudo xcode-select -s /Applications/Xcode.app` i Terminal.

**Appen starter ikke på telefon**
→ Sjekk at PC og telefon er på samme WiFi. Prøv å trykke `s` i terminalen for å bytte til Expo Go.

**Rød feilmelding i appen**
→ Les feilmeldingen nøye. Oftest er det en skrivefeil eller manglende import. Kopier feilmeldingen og send til meg, så fikser jeg det.
