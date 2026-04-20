import {
  formatPrice,
  getCheapestStore,
  getFilteredProducts,
  getStoreInfo,
} from "../../src/utils/helpers";

describe("helpers (unit)", () => {
  const products = [
    {
      id: "1",
      name: "Tine Helmelk 1L",
      category: "Meieri",
      prices: { rema: 22.9, kiwi: 24.9, meny: 27.5 },
    },
    {
      id: "2",
      name: "Banan",
      category: "Frukt",
      prices: { kiwi: 19.9, meny: 25.9 },
    },
    {
      id: "3",
      name: "Gilde Kjøttdeig 400g",
      category: "Kjøtt",
      prices: { rema: 49.9, joker: 57.9 },
    },
  ];

  test("getCheapestStore finner laveste pris", () => {
    const cheapest = getCheapestStore(products[0]);
    expect(cheapest).toEqual({ store: "rema", price: 22.9 });
  });

  test("getFilteredProducts filtrerer på søk, kategori og butikk", () => {
    const result = getFilteredProducts({
      products,
      searchQuery: "ban",
      selectedStore: "kiwi",
      selectedCategory: "Frukt",
      sortOrder: "low",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  test("getFilteredProducts sorterer stigende og synkende", () => {
    const low = getFilteredProducts({
      products,
      selectedStore: "all",
      sortOrder: "low",
    });
    const high = getFilteredProducts({
      products,
      selectedStore: "all",
      sortOrder: "high",
    });

    expect(low.map((p) => p.id)).toEqual(["2", "1", "3"]);
    expect(high.map((p) => p.id)).toEqual(["3", "1", "2"]);
  });

  test("formatPrice formatterer med to desimaler", () => {
    expect(formatPrice(19)).toBe("19.00");
    expect(formatPrice(19.9)).toBe("19.90");
  });

  test("getStoreInfo gir fallback for ukjent butikk", () => {
    expect(getStoreInfo("unknown_store")).toEqual({
      name: "unknown_store",
      color: "#999",
      bg: "#f0f0f0",
    });
  });
});
