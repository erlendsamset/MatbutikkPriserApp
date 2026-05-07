import * as FileSystem from "expo-file-system/legacy";

const VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY;
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

const NUMERIC_ONLY = /^\d+([,\.]\d+)?$/;

const SKIP_KEYWORDS = [
  "total", "totalt", "sum", "mva", "rabatt", "retur", "kontant",
  "visa", "mastercard", "vipps", "kort", "betalingsmåte", "tilbake",
  "du sparte", "du spart", "bonus", "pant", "handlepose", "pose",
  "kvittering", "butikk", "telefon", "org.nr", "dato", "tid",
  "kasse", "betjent", "trinn", "trekk",
  "grunnlag", "bank", "overf", "salgs", "ant. varer", "term.",
  "bax", "godkjent", "takk for", "antall:", "kr/stk", "coopay", "transid",
  "herav", "dagligvarer", "øvrige", "artikler", "kasserer", "clerk",
  "terminal", "contactless", "åpent", "tlf", "org.nr",
  "aid:", "kjøp", "bankaxept", "netssdi", "approved", "arc:", "tvr:",
  "norsk butikk", "foretaks", "salgskvittering", "butikknr",
];

function parsePriceToken(token) {
  if (!token) return null;
  const cleaned = token
    .toLowerCase()
    .replace(/\b(kr|nok)\b/g, "")
    .replace(/\s+/g, "")
    .replace(/[o]/g, "0") // vanlig OCR-feil i tall
    .trim();

  if (!cleaned) return null;

  // 1290 -> 12.90 (kun hvis rene siffer og minst 3 tegn)
  if (/^\d{3,}$/.test(cleaned)) {
    const n = parseFloat(`${cleaned.slice(0, -2)}.${cleaned.slice(-2)}`);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const normalized = cleaned.replace(",", ".");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractTrailingPrice(line) {
  if (!line) return null;
  const match = line.match(/(-?\d[\d\s.,oO]*\d(?:[,\.]\d{1,2})?|[-+]?\d{3,})\s*(?:kr|nok)?\s*$/i);
  if (!match) return null;
  return parsePriceToken(match[1]);
}

function isProductName(name) {
  if (name.length < 3) return false;
  if (NUMERIC_ONLY.test(name)) return false;
  if (!/[a-zæøå]/i.test(name)) return false;
  if (SKIP_KEYWORDS.some((kw) => name.toLowerCase().includes(kw))) return false;
  return true;
}

export async function runOCR(imageUri) {
  if (!VISION_API_KEY) {
    throw new Error("Mangler Google Vision API-nøkkel.");
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: "base64",
  });

  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
      },
    ],
  };

  const response = await fetch(VISION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Vision API feilet: ${response.status}`);
  }

  const json = await response.json();
  const visionResponse = json.responses?.[0] ?? {};
  const rawText =
    visionResponse.fullTextAnnotation?.text ??
    visionResponse.textAnnotations?.[0]?.description ??
    "";

  if (__DEV__ && !rawText.trim()) {
    console.warn("[scan:ocr-empty]", {
      imageUri,
      responseKeys: Object.keys(visionResponse),
      error: visionResponse.error,
      textAnnotationCount: visionResponse.textAnnotations?.length ?? 0,
    });
  }

  console.log("=== OCR RAW TEXT ===\n" + rawText + "\n===================");
  return parseReceiptText(rawText);
}

export function parseReceiptText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = [];

  const priceOnly = (line) => extractTrailingPrice(line) !== null;
  const vatOnly = /^\d+%$/;

  // Samle stykpriser fra "Antall: N stk PRIS kr/stk" — brukes som prisoverride i alle formater
  const unitPrices = {};
  for (let i = 1; i < lines.length; i++) {
    const am = lines[i].match(/antall:\s*\d+\s*stk\s+([\d\s.,oO]+)\s*kr\/stk/i);
    if (!am) continue;
    const up = parsePriceToken(am[1]);
    if (up <= 0) continue;
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      const c = lines[j].replace(/\s+\d[\d\s]*[,\.]\d{2}\s*$/, "").trim();
      if (!isProductName(c)) continue;
      unitPrices[c.toLowerCase()] = up;
      break;
    }
  }

  const withUnitPrice = (name, fallbackPrice) =>
    unitPrices[name.toLowerCase()] ?? fallbackPrice;

  // Format 1: NAME / VAT% / PRICE (Rema 1000/Kiwi)
  // Håndterer også "NAME VAT%" / PRICE når OCR legger MVA på varelinjen.
  // Sjekker også "N x kr STYKPRIS" på neste linje
  const multiBuyLine = /(\d+)\s*[xX]\s*(?:kr\s+)?(\d+[,\.]\d{2})/i;
  const inlineVatLine = /^(.+?)\s+\d+%$/;
  for (let i = 1; i < lines.length; i++) {
    if (!priceOnly(lines[i])) continue;

    let name = null;
    if (i >= 2 && vatOnly.test(lines[i - 1])) {
      name = lines[i - 2].replace(/^#+/, "").trim();
    } else {
      const inlineVatMatch = lines[i - 1].match(inlineVatLine);
      if (inlineVatMatch) {
        name = inlineVatMatch[1].replace(/^#+/, "").trim();
      }
    }

    if (!name || !isProductName(name)) continue;
    let price = extractTrailingPrice(lines[i]);
    if (price <= 0) continue;
    const nextLine = lines[i + 1] ?? "";
    const unitMatch = nextLine.match(multiBuyLine);
    if (unitMatch) price = parsePriceToken(unitMatch[2]);
    items.push({ name, price: withUnitPrice(name, price) });
  }

  if (items.length > 0) return items;

  // Format 2: Bunnpris — linjer med # prefix
  const hasBunnprisItems = lines.some((l) => l.startsWith("#"));
  if (hasBunnprisItems) {
    const seen = new Set();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("#")) continue;

      const sameLineMatch = line.match(/^(#\S.+?)\s{2,}([\d\s.,oO]+(?:kr|nok)?)\s*$/i);
      if (sameLineMatch) {
        const price = parsePriceToken(sameLineMatch[2]);
        const name = sameLineMatch[1].replace(/^#+/, "").trim();
        if (isProductName(name) && price > 0 && !seen.has(name.toLowerCase())) {
          items.push({ name, price: withUnitPrice(name, price) });
          seen.add(name.toLowerCase());
        }
        continue;
      }

      // Håndter tolinjes format: #PRODUKTNAVN / PRIS
      // Først: sjekk under produktet (vanligste)
      const pricesBelow = [];
      for (let j = i + 1; j < lines.length && j < i + 6; j++) {
        const checkLine = lines[j];
        if (
          /^&\s*\+\s*pant|^pant\s*$/i.test(checkLine) ||
          /normalpris|rabatt/i.test(checkLine) ||
          /\d+%\s*$/.test(checkLine)
        ) {
          continue;
        }
        const p = extractTrailingPrice(checkLine);
        // Filtrer bort små verdier (<10) som er sannsynligvis pant, ikke produktpris
        if (p && p >= 10) {
          pricesBelow.push({ price: p, idx: j });
        }
      }

      let price = null;
      let skipToIdx = -1;

      if (pricesBelow.length > 0) {
        // Hvis det finnes priser under, ta den største
        price = Math.max(...pricesBelow.map((p) => p.price));
        skipToIdx = Math.max(...pricesBelow.map((p) => p.idx));
      } else {
        // Hvis ingen pris under, se bakover etter en som ikke er tatt
        // Søk lengre ned hvis nødvendig (opp til 5 linjer bakover)
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const checkLine = lines[j];
          if (
            /^#+/.test(checkLine) ||
            /^&\s*\+\s*pant|^pant\s*$/i.test(checkLine) ||
            /normalpris|rabatt/i.test(checkLine)
          ) {
            continue;
          }
          const p = extractTrailingPrice(checkLine);
          // Også filtrer små verdier når man søker bakover
          if (p && p >= 10) {
            price = p;
            break;
          }
        }
      }

      if (price && price > 0) {
        const name = line.replace(/^#+/, "").trim();
        if (isProductName(name) && !seen.has(name.toLowerCase())) {
          items.push({ name, price: withUnitPrice(name, price) });
          seen.add(name.toLowerCase());
          if (skipToIdx !== -1) i = skipToIdx;
        }
      }
    }
  }

  if (items.length > 0) return items;

  // Format 3: kolonneformat — OCR leser alle navn og alle priser i separate blokker
  // Krever bekreftet artikkelantall fra "Totalt (X Artikler)" for å unngå falske treff
  const artiklerLine = lines.find((l) => /\((\d+)\s*artikler\)/i.test(l));
  if (artiklerLine) {
    const count = parseInt(artiklerLine.match(/\((\d+)\s*artikler\)/i)[1]);

    const firstConsecPrice = lines.findIndex(
      (l, i) => priceOnly(l) && i + 1 < lines.length && priceOnly(lines[i + 1])
    );

    if (firstConsecPrice !== -1) {
      const priceBlock = lines.slice(firstConsecPrice).filter((l) => priceOnly(l));

      // Bare bruk kolonneformat hvis prisblokken faktisk inneholder nok priser
      if (priceBlock.length >= count) {
        const nameCandidates = lines.slice(0, firstConsecPrice).filter((l) => isProductName(l));
        const names = nameCandidates.slice(-count);
        const prices = priceBlock.slice(0, count);

        for (let i = 0; i < Math.min(names.length, prices.length); i++) {
          const fallback = extractTrailingPrice(prices[i]);
          const price = withUnitPrice(names[i], fallback);
          if (price > 0) items.push({ name: names[i], price });
        }
      }
    }
  }

  if (items.length > 0) return items;

  // Format 4: NAVN PRIS på samme linje
  for (const line of lines) {
    const priceMatch = line.match(/(-?\d[\d\s.,oO]*\d(?:[,\.]\d{1,2})?|[-+]?\d{3,})\s*(?:kr|nok)?\s*$/i);
    if (!priceMatch) continue;
    const price = parsePriceToken(priceMatch[1]);
    if (price <= 0) continue;
    const name = line
      .slice(0, line.lastIndexOf(priceMatch[1]))
      .replace(/^#+/, "")
      .replace(/\s*\d+\s*[xX]\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!isProductName(name)) continue;
    items.push({ name, price: withUnitPrice(name, price) });
  }

  if (items.length > 0) return items;

  // Format 5: tolinjes NAVN / PRIS (generell fallback)
  for (let i = 0; i < lines.length - 1; i++) {
    if (!priceOnly(lines[i + 1])) continue;
    const name = lines[i].replace(/\s+\d[\d\s]*[,\.]\d{2}\s*$/, "").trim();
    if (!isProductName(name)) continue;
    const price = extractTrailingPrice(lines[i + 1]);
    if (price <= 0) continue;
    items.push({ name, price: withUnitPrice(name, price) });
    i++;
  }

  if (items.length > 0) return items;

  // Siste fallback: rene Antall-varer (engros-kvittering uten annet format)
  for (const [name, price] of Object.entries(unitPrices)) {
    items.push({ name, price });
  }

  return items;
}
