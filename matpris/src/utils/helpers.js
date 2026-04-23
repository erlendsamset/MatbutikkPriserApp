/*
 * helpers.js — Hjelpefunksjoner for produktdata
 *
 * getCheapestStore(product): returnerer butikknøkkel og pris for billigste alternativ
 * getFilteredProducts(...): filtrerer og sorterer produktlisten basert på søk,
 *   valgt butikk, valgt kategori og sorteringsrekkefølge
 * formatPrice(price): formaterer et tall til to desimaler (f.eks. 22.9 → "22.90")
 * getStoreInfo(storeKey): slår opp visningsnavn og farger for en butikknøkkel,
 *   med fallback hvis nøkkelen ikke finnes i STORES
 */

import { STORES } from "./constants";

export function getCheapestStore(product) {
  return Object.entries(product.prices).reduce(
    (best, [store, price]) => (price < best.price ? { store, price } : best),
    { store: null, price: Infinity }
  );
}

export function getFilteredProducts({
  products = [],
  searchQuery = "",
  selectedStore = "all",
  selectedCategory = "all",
  sortOrder = "low",
}) {
  const q = searchQuery.toLowerCase().trim();
  const getPrice = (p) =>
    selectedStore !== "all"
      ? p.prices[selectedStore] ?? 999
      : Math.min(...Object.values(p.prices));

  return [...products]
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    .filter((p) => selectedCategory === "all" || p.category === selectedCategory)
    .filter((p) => selectedStore === "all" || p.prices[selectedStore] !== undefined)
    .sort((a, b) => sortOrder === "low" ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a));
}

export const formatPrice = (price) => price.toFixed(2);

export const getStoreInfo = (storeKey) =>
  STORES[storeKey] ?? { name: storeKey, color: "#999", bg: "#f0f0f0" };
