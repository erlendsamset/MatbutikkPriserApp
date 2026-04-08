// src/utils/constants.js

export const STORES = {
  rema: { name: "Rema 1000", color: "#0060A9", bg: "#E8F1F8" },
  kiwi: { name: "Kiwi", color: "#6B9B1E", bg: "#EFF5E5" },
  coop_prix: { name: "Coop Prix", color: "#E2001A", bg: "#FDEBEE" },
  coop_extra: { name: "Coop Extra", color: "#E2001A", bg: "#FDEBEE" },
  meny: { name: "Meny", color: "#C8102E", bg: "#FAE9EC" },
  bunnpris: { name: "Bunnpris", color: "#F7941E", bg: "#FEF3E3" },
  joker: { name: "Joker", color: "#1B3668", bg: "#E8ECF3" },
  spar: { name: "Spar", color: "#007A3D", bg: "#E5F2EB" },
};

export const CATEGORIES = [
  "Meieri",
  "Kjøtt",
  "Fisk",
  "Frukt & Grønt",
  "Tørrvarer",
  "Drikke",
  "Pålegg",
  "Sauser",
  "Ferdigmat",
  "Frossenvarer",
  "Snacks",
];

export const SAMPLE_DATA = [
  { id: "1", name: "Tine Helmelk 1L", category: "Meieri", prices: { rema: 22.9, kiwi: 23.5, coop_prix: 22.9, meny: 24.9, bunnpris: 23.9, spar: 23.5 } },
  { id: "2", name: "Gilde Kjøttdeig 400g", category: "Kjøtt", prices: { rema: 49.9, kiwi: 52.9, coop_prix: 54.9, meny: 59.9, bunnpris: 54.9, joker: 56.9 } },
  { id: "3", name: "Fiskemannen Laksfilet 400g", category: "Fisk", prices: { rema: 79.9, kiwi: 84.9, coop_extra: 82.9, meny: 89.9 } },
  { id: "4", name: "First Price Spaghetti 1kg", category: "Tørrvarer", prices: { rema: 12.9, kiwi: 14.9, coop_prix: 13.9, coop_extra: 12.9, bunnpris: 14.9 } },
  { id: "5", name: "Norvegia 500g", category: "Meieri", prices: { rema: 69.9, kiwi: 72.9, coop_prix: 74.9, meny: 79.9, spar: 74.9, joker: 76.9 } },
  { id: "6", name: "Pepsi Max 1.5L", category: "Drikke", prices: { rema: 24.9, kiwi: 26.9, coop_prix: 25.9, meny: 29.9, bunnpris: 26.9, spar: 27.9 } },
  { id: "7", name: "Påleggsskinke Gilde 100g", category: "Pålegg", prices: { rema: 29.9, kiwi: 32.9, coop_extra: 31.9, meny: 35.9, joker: 33.9 } },
  { id: "8", name: "Grandiosa Original", category: "Frossenvarer", prices: { rema: 39.9, kiwi: 44.9, coop_prix: 42.9, meny: 49.9, bunnpris: 44.9, spar: 44.9 } },
  { id: "9", name: "Egg Frittgående 12pk", category: "Meieri", prices: { rema: 59.9, kiwi: 64.9, coop_prix: 62.9, meny: 69.9, spar: 64.9 } },
  { id: "10", name: "Jarlsberg 500g", category: "Meieri", prices: { rema: 89.9, kiwi: 94.9, coop_extra: 92.9, meny: 99.9, bunnpris: 94.9 } },
  { id: "11", name: "Idun Ketchup 560g", category: "Sauser", prices: { rema: 34.9, kiwi: 37.9, coop_prix: 36.9, meny: 39.9 } },
  { id: "12", name: "Fjordland Middag 450g", category: "Ferdigmat", prices: { rema: 49.9, kiwi: 54.9, coop_prix: 52.9, meny: 59.9, spar: 54.9 } },
  { id: "13", name: "Bananer 1kg", category: "Frukt & Grønt", prices: { rema: 19.9, kiwi: 22.9, coop_prix: 21.9, meny: 24.9, bunnpris: 22.9, joker: 23.9 } },
  { id: "14", name: "Avokado 2pk", category: "Frukt & Grønt", prices: { rema: 29.9, kiwi: 34.9, coop_extra: 32.9, meny: 39.9 } },
  { id: "15", name: "Smør Tine 500g", category: "Meieri", prices: { rema: 59.9, kiwi: 62.9, coop_prix: 64.9, meny: 69.9, spar: 64.9, joker: 66.9 } },
];

export const MOCK_RECEIPT_ITEMS = [
  { name: "Tine Helmelk 1L", price: 22.90 },
  { name: "Gilde Kjøttdeig 400g", price: 49.90 },
  { name: "Bananer 1kg", price: 19.90 },
  { name: "Pepsi Max 1.5L", price: 24.90 },
  { name: "Norvegia 500g", price: 69.90 },
];

export const COLORS = {
  bg: "#FAFBF7",
  card: "#FFFFFF",
  text: "#1A2E1D",
  textSecondary: "#5A6350",
  textMuted: "#9CA38B",
  border: "#EFF1EA",
  borderDark: "#E2E6DA",
  accent: "#1A4023",
  accentLight: "#EFF5E5",
  success: "#6B9B1E",
  warning: "#F7941E",
  danger: "#C0392B",
};
