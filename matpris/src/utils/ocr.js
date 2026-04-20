import * as FileSystem from "expo-file-system/legacy";

const VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY;
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

// Lines containing these strings are skipped (totals, payment, VAT, etc.)
const SKIP_KEYWORDS = [
  "total", "totalt", "sum", "mva", "rabatt", "retur", "kontant",
  "visa", "mastercard", "vipps", "kort", "betalingsmåte", "tilbake",
  "du sparte", "du spart", "bonus", "pant", "handlepose", "pose",
  "kvittering", "butikk", "telefon", "org.nr", "dato", "tid",
  "kasse", "betjent", "trinn", "trekk",
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

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (SKIP_KEYWORDS.some((kw) => lower.includes(kw))) continue;

    // Match price at end of line: e.g. "29,90" or "129.00" or "-15,00"
    const priceMatch = line.match(/(-?\d+[,\.]\d{2})\s*$/);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1].replace(",", "."));
    if (price <= 0) continue; // skip discounts/negative lines

    // Remove price from end to get product name
    const name = line
      .slice(0, line.lastIndexOf(priceMatch[1]))
      .replace(/\s*\d+\s*[xX]\s*$/, "") // remove quantity "2 x" suffix
      .replace(/\s+/g, " ")
      .trim();

    if (name.length < 2) continue;

    items.push({ name, price });
  }

  return items;
}
