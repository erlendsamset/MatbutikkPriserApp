// src/utils/helpers.js

import { STORES, SAMPLE_DATA } from "./constants";

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
  searchQuery = "",
  selectedStore = "all",
  selectedCategory = "all",
  sortOrder = "low",
}) {
  let products = [...SAMPLE_DATA];

  // Filter by search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  // Filter by category
  if (selectedCategory !== "all") {
    products = products.filter((p) => p.category === selectedCategory);
  }

  // Filter by store (only show products available at this store)
  if (selectedStore !== "all") {
    products = products.filter((p) => p.prices[selectedStore] !== undefined);
  }

  // Sort by price
  products.sort((a, b) => {
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

  return products;
}

export function formatPrice(price) {
  return price.toFixed(2);
}

export function getStoreInfo(storeKey) {
  return STORES[storeKey] || { name: storeKey, color: "#999", bg: "#f0f0f0" };
}
