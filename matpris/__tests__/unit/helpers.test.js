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

  test("getFilteredProducts filtrerer på søk og butikk", () => {
    const result = getFilteredProducts({
      products,
      searchQuery: "ban",
      selectedStore: "kiwi",
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

  test("getStoreInfo returnerer riktig info for kjent butikk", () => {
    const info = getStoreInfo("rema");
    expect(info.name).toBe("Rema 1000");
    expect(info.color).toBeTruthy();
  });

  test("getFilteredProducts sorterer etter flest butikker", () => {
    const result = getFilteredProducts({
      products,
      selectedStore: "all",
      sortOrder: "coverage",
    });
    expect(result[0].id).toBe("1"); // Tine Helmelk: 3 butikker
    expect(result[result.length - 1].id).toBe("3"); // Kjøttdeig: 2 butikker
  });

  test("getFilteredProducts filtrerer ut produkter uten navn", () => {
    const withNull = [...products, { id: "99", name: null, category: "Test", prices: { rema: 10 } }];
    const result = getFilteredProducts({ products: withNull, selectedStore: "all", sortOrder: "low" });
    expect(result.find((p) => p.id === "99")).toBeUndefined();
  });

  test("getFilteredProducts returnerer tom liste for tomt array", () => {
    const result = getFilteredProducts({ products: [], selectedStore: "all", sortOrder: "low" });
    expect(result).toHaveLength(0);
  });

  test("getCheapestStore fungerer med kun én butikk", () => {
    const p = { id: "x", name: "Solo", prices: { meny: 55.0 } };
    expect(getCheapestStore(p)).toEqual({ store: "meny", price: 55.0 });
  });

  test("formatPrice formatterer 0 korrekt", () => {
    expect(formatPrice(0)).toBe("0.00");
  });
});
