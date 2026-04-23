/*
 * ocr.js — Kvitteringstolking via Google Cloud Vision
 *
 * runOCR(imageUri): leser bildet fra disk, sender det base64-kodet til
 *   Google Cloud Vision API (TEXT_DETECTION), og returnerer en liste med
 *   { name, price }-objekter.
 *
 * parseReceiptText(text): prøver tre ulike kvitteringsformater i prioritert rekkefølge:
 *   Format 1 — Rema 1000: NAVN / MVA% / PRIS på tre separate linjer
 *   Format 2 — Bunnpris: linjer som starter med #, pris på samme eller neste linje
 *   Format 3 — Kiwi/Coop: NAVN PRIS på samme linje
 *
 * Filtrering: linjer som inneholder SKIP_KEYWORDS (totaler, betalingsinfo o.l.)
 * hoppes over. Produktnavn som kun er et tall filtreres også bort.
 */

import * as FileSystem from "expo-file-system/legacy";

const VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY;
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

// Lines containing these strings are skipped (totals, payment, VAT, etc.)
const NUMERIC_ONLY = /^\d+([,\.]\d+)?$/;

const SKIP_KEYWORDS = [
  "total", "totalt", "sum", "mva", "rabatt", "retur", "kontant",
  "visa", "mastercard", "vipps", "kort", "betalingsmåte", "tilbake",
  "du sparte", "du spart", "bonus", "pant", "handlepose", "pose",
  "kvittering", "butikk", "telefon", "org.nr", "dato", "tid",
  "kasse", "betjent", "trinn", "trekk",
  "grunnlag", "bank", "overf", "salgs", "ant. varer", "term.",
  "bax", "godkjent", "takk for",
];

export async function runOCR(imageUri) {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: "base64",
  });

  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
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
  const rawText = json.responses?.[0]?.textAnnotations?.[0]?.description ?? "";
  return parseReceiptText(rawText);
}

function parseReceiptText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = [];

  const priceOnly = /^-?\d+[,\.]\d{2}$/;
  const vatOnly = /^\d+%$/;

  // Format 1: NAME / VAT% / PRICE (Rema 1000 og lignende)
  for (let i = 2; i < lines.length; i++) {
    if (priceOnly.test(lines[i]) && vatOnly.test(lines[i - 1])) {
      const price = parseFloat(lines[i].replace(",", "."));
      if (price <= 0) continue;

      const name = lines[i - 2].replace(/^#+/, "").trim();
      if (SKIP_KEYWORDS.some((kw) => name.toLowerCase().includes(kw))) continue;
      if (name.length < 2) continue;
      if (NUMERIC_ONLY.test(name)) continue;

      items.push({ name, price });
    }
  }

  if (items.length > 0) return items;

  // Format 2: Bunnpris — linjer med # prefix
  // OCR kan gi pris på samme linje (separert med mellomrom) eller på neste linje
  const hasBunnprisItems = lines.some((l) => l.startsWith("#"));
  if (hasBunnprisItems) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("#")) continue;

      // Pris på samme linje: #NAVN    42.90
      const sameLineMatch = line.match(/^(#\S.+?)\s{2,}(\d+[,\.]\d{2})\s*$/);
      if (sameLineMatch) {
        const price = parseFloat(sameLineMatch[2].replace(",", "."));
        const name = sameLineMatch[1].replace(/^#+/, "").trim();
        if (name.length >= 2 && price > 0 && !NUMERIC_ONLY.test(name) && !SKIP_KEYWORDS.some((kw) => name.toLowerCase().includes(kw))) {
          items.push({ name, price });
        }
        continue;
      }

      // Pris på neste linje: #NAVN\n42.90
      if (i + 1 < lines.length && priceOnly.test(lines[i + 1])) {
        const price = parseFloat(lines[i + 1].replace(",", "."));
        const name = line.replace(/^#+/, "").trim();
        if (name.length >= 2 && price > 0 && !NUMERIC_ONLY.test(name) && !SKIP_KEYWORDS.some((kw) => name.toLowerCase().includes(kw))) {
          items.push({ name, price });
          i++;
        }
      }
    }
  }

  if (items.length > 0) return items;

  // Format 3: NAVN PRIS på samme linje (Kiwi, Coop og lignende)
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (SKIP_KEYWORDS.some((kw) => lower.includes(kw))) continue;

    const priceMatch = line.match(/(-?\d+[,\.]\d{2})\s*$/);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1].replace(",", "."));
    if (price <= 0) continue;

    const name = line
      .slice(0, line.lastIndexOf(priceMatch[1]))
      .replace(/^#+/, "")
      .replace(/\s*\d+\s*[xX]\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (name.length < 2) continue;
    if (NUMERIC_ONLY.test(name)) continue;
    items.push({ name, price });
  }

  return items;
}
