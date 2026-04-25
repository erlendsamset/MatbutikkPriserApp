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

function isProductName(name) {
  if (name.length < 3) return false;
  if (NUMERIC_ONLY.test(name)) return false;
  if (!/[a-zæøå]/i.test(name)) return false;
  if (SKIP_KEYWORDS.some((kw) => name.toLowerCase().includes(kw))) return false;
  return true;
}

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
  console.log("=== OCR RAW TEXT ===\n" + rawText + "\n===================");
  return parseReceiptText(rawText);
}

function parseReceiptText(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = [];

  const priceOnly = /^-?\d+[,\.]\d{2}$/;
  const vatOnly = /^\d+%$/;

  // Format 1: NAME / VAT% / PRICE (Rema 1000)
  for (let i = 2; i < lines.length; i++) {
    if (priceOnly.test(lines[i]) && vatOnly.test(lines[i - 1])) {
      const price = parseFloat(lines[i].replace(",", "."));
      if (price <= 0) continue;
      const name = lines[i - 2].replace(/^#+/, "").trim();
      if (!isProductName(name)) continue;
      items.push({ name, price });
    }
  }

  if (items.length > 0) return items;

  // Format 2: Bunnpris — linjer med # prefix
  const hasBunnprisItems = lines.some((l) => l.startsWith("#"));
  if (hasBunnprisItems) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("#")) continue;

      const sameLineMatch = line.match(/^(#\S.+?)\s{2,}(\d+[,\.]\d{2})\s*$/);
      if (sameLineMatch) {
        const price = parseFloat(sameLineMatch[2].replace(",", "."));
        const name = sameLineMatch[1].replace(/^#+/, "").trim();
        if (isProductName(name) && price > 0) items.push({ name, price });
        continue;
      }

      if (i + 1 < lines.length && priceOnly.test(lines[i + 1])) {
        const price = parseFloat(lines[i + 1].replace(",", "."));
        const name = line.replace(/^#+/, "").trim();
        if (isProductName(name) && price > 0) {
          items.push({ name, price });
          i++;
        }
      }
    }
  }

  if (items.length > 0) return items;

  // Format 2b: Coop Mega — "Antall: X stk  PRIS kr/stk"
  const hasAntall = lines.some((l) => /antall:\s*\d+\s*stk/i.test(l));
  if (hasAntall) {
    for (let i = 1; i < lines.length; i++) {
      const antallMatch = lines[i].match(/antall:\s*\d+\s*stk\s+(\d+[,\.]\d{2})\s*kr\/stk/i);
      if (!antallMatch) continue;
      const price = parseFloat(antallMatch[1].replace(",", "."));
      if (price <= 0) continue;
      let name = null;
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const candidate = lines[j].replace(/\s+\d[\d\s]*[,\.]\d{2}\s*$/, "").trim();
        if (!isProductName(candidate)) continue;
        name = candidate;
        break;
      }
      if (name) items.push({ name, price });
    }
  }

  if (items.length > 0) return items;

  // Format 3: kolonneformat — OCR leser alle navn og alle priser i separate blokker
  // Detektert ved at to eller flere prislinjer kommer etter hverandre
  const firstConsecPrice = lines.findIndex(
    (l, i) => priceOnly.test(l) && i + 1 < lines.length && priceOnly.test(lines[i + 1])
  );

  if (firstConsecPrice !== -1) {
    const nameCandidates = lines.slice(0, firstConsecPrice).filter((l) => isProductName(l));
    const priceBlock = lines.slice(firstConsecPrice).filter((l) => priceOnly.test(l));

    const artiklerLine = lines.find((l) => /\((\d+)\s*artikler\)/i.test(l));
    const count = artiklerLine
      ? parseInt(artiklerLine.match(/\((\d+)\s*artikler\)/i)[1])
      : Math.min(nameCandidates.length, priceBlock.length);

    // Produktnavnene er de SISTE i listen — headere kommer øverst i OCR-output
    const names = nameCandidates.slice(-count);
    const prices = priceBlock.slice(0, count);

    for (let i = 0; i < Math.min(names.length, prices.length); i++) {
      const price = parseFloat(prices[i].replace(",", "."));
      if (price > 0) items.push({ name: names[i], price });
    }
  }

  if (items.length > 0) return items;

  // Format 4: NAVN PRIS på samme linje
  for (const line of lines) {
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
    if (!isProductName(name)) continue;
    items.push({ name, price });
  }

  if (items.length > 0) return items;

  // Format 5: tolinjes NAVN / PRIS (generell fallback)
  for (let i = 0; i < lines.length - 1; i++) {
    if (!priceOnly.test(lines[i + 1])) continue;
    const name = lines[i].replace(/\s+\d[\d\s]*[,\.]\d{2}\s*$/, "").trim();
    if (!isProductName(name)) continue;
    const price = parseFloat(lines[i + 1].replace(",", "."));
    if (price <= 0) continue;
    items.push({ name, price });
    i++;
  }

  return items;
}
