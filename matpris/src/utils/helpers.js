// src/utils/helpers.js

import { STORES } from "./constants";

export function getCheapestStore(product) {
  let minPrice = Infinity;
  let cheapestStore = null;

  for (const [storeKey, price] of Object.entries(product.prices)) {
    if (price < minPrice) {
      minPrice = price;
      cheapestStore = storeKey;
    }
  }

  return { store: cheapestStore, price: minPrice };
}

export function getFilteredProducts({
  products = [],
  searchQuery = "",
  selectedStore = "all",
  selectedCategory = "all",
  sortOrder = "low",
}) {
  let result = [...products];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (selectedCategory !== "all") {
    result = result.filter((p) => p.category === selectedCategory);
  }

  if (selectedStore !== "all") {
    result = result.filter((p) => p.prices[selectedStore] !== undefined);
  }

  result.sort((a, b) => {
    const priceA =
      selectedStore !== "all"
        ? a.prices[selectedStore] || 999
        : Math.min(...Object.values(a.prices));
    const priceB =
      selectedStore !== "all"
        ? b.prices[selectedStore] || 999
        : Math.min(...Object.values(b.prices));

    return sortOrder === "low" ? priceA - priceB : priceB - priceA;
  });

  return result;
}

export function formatPrice(price) {
  return price.toFixed(2);
}

export function getStoreInfo(storeKey) {
  return STORES[storeKey] || { name: storeKey, color: "#999", bg: "#f0f0f0" };
}
