/*
 * helpers.js — Hjelpefunksjoner for produktdata
 *
 * getCheapestStore(product): returnerer butikknøkkel og pris for billigste alternativ
 * getFilteredProducts(...): filtrerer og sorterer produktlisten basert på søk,
 *   valgt butikk og sorteringsrekkefølge
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
  sortOrder = "low",
}) {
  const q = searchQuery.toLowerCase().trim();
  const getPrice = (p) =>
    selectedStore !== "all"
      ? p.prices[selectedStore] ?? 999
      : Math.min(...Object.values(p.prices));

  return [...products]
    .filter((p) => p.name)
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .filter((p) => selectedStore === "all" || p.prices[selectedStore] !== undefined)
    .sort((a, b) => {
      if (sortOrder === "coverage") return Object.keys(b.prices).length - Object.keys(a.prices).length;
      if (sortOrder === "kg") {
        const aPrice = getPrice(a);
        const bPrice = getPrice(b);
        const aKg = a.weight_grams ? (aPrice / a.weight_grams) * 1000 : Infinity;
        const bKg = b.weight_grams ? (bPrice / b.weight_grams) * 1000 : Infinity;
        return aKg - bKg;
      }
      return sortOrder === "low" ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a);
    });
}

export const formatPrice = (price) => price.toFixed(2);

export const getStoreInfo = (storeKey) =>
  STORES[storeKey] ?? { name: storeKey, color: "#999", bg: "#f0f0f0" };
