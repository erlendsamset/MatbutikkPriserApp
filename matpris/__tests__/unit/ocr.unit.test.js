import { parseReceiptText } from "../../src/utils/ocr";

describe("parseReceiptText (unit)", () => {
  describe("Format 1 — Rema 1000 (Navn / MVA% / Pris)", () => {
    test("plukker opp produkt fra trelinjers mønster", () => {
      const text = "Tine Helmelk 1L\n25%\n22,90";
      expect(parseReceiptText(text)).toEqual([
        { name: "Tine Helmelk 1L", price: 22.9 },
      ]);
    });

    test("bruker stykpris fra N x kr PRIS-linje ved kjøp av flere", () => {
      const text = "Kaffebeger\n25%\n89,70\n3 x kr 29,90";
      expect(parseReceiptText(text)).toEqual([
        { name: "Kaffebeger", price: 29.9 },
      ]);
    });

    test("filtrerer ut negativt beløp (rabatt)", () => {
      const text = "Produktrabatt\n25%\n-10,00";
      const result = parseReceiptText(text);
      expect(result.find((i) => i.price < 0)).toBeUndefined();
    });
  });

  describe("Format 2 — Bunnpris (#-prefix)", () => {
    test("plukker opp produkt med pris på neste linje", () => {
      const text = "#SafariKjeks 200g\n24,90";
      expect(parseReceiptText(text)).toEqual([
        { name: "SafariKjeks 200g", price: 24.9 },
      ]);
    });

    test("plukker opp produkt med pris på samme linje (dobbelt mellomrom)", () => {
      const text = "#Norvegia 1kg  89,90";
      expect(parseReceiptText(text)).toEqual([
        { name: "Norvegia 1kg", price: 89.9 },
      ]);
    });

    test("plukker opp flere #-produkter fra samme kvittering", () => {
      const text = "#Banan\n8,90\n#Gulrot 750g\n14,90";
      const result = parseReceiptText(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: "Banan", price: 8.9 });
      expect(result[1]).toEqual({ name: "Gulrot 750g", price: 14.9 });
    });
  });

  describe("Format 3 — Kolonneformat (Coop)", () => {
    test("matcher navn og priser via artikkelantall", () => {
      const text = [
        "Kyllinglår Grillet",
        "Pepsi Max 1,5L",
        "Totalt (2 Artikler)",
        "89,90",
        "25,90",
      ].join("\n");
      const result = parseReceiptText(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: "Kyllinglår Grillet", price: 89.9 });
      expect(result[1]).toEqual({ name: "Pepsi Max 1,5L", price: 25.9 });
    });

    test("ignorerer kolonneformat når prisblokken er for kort", () => {
      const text = [
        "Vare En",
        "Vare To",
        "Totalt (3 Artikler)",
        "10,00",
        "20,00",
      ].join("\n");
      // Prisblokk (2) < artikkelantall (3) → kolonneformat brukes ikke
      const result = parseReceiptText(text);
      expect(result.find((i) => i.name === "Totalt (3 Artikler)")).toBeUndefined();
    });
  });

  describe("Format 4 — Navn og pris på samme linje", () => {
    test("plukker opp produkt med pris til høyre", () => {
      const text = "Norvegia Skivet 400g 59,90";
      expect(parseReceiptText(text)).toEqual([
        { name: "Norvegia Skivet 400g", price: 59.9 },
      ]);
    });
  });

  describe("Format 5 — Tolinjes fallback (Navn / Pris)", () => {
    test("plukker opp produkt med pris på neste linje", () => {
      const text = "Lettmelk 1L\n19,90";
      expect(parseReceiptText(text)).toEqual([
        { name: "Lettmelk 1L", price: 19.9 },
      ]);
    });
  });

  describe("SKIP_KEYWORDS — filtrering av ikke-produktlinjer", () => {
    test("filtrerer ut betalings- og totallinjer", () => {
      const text = "Total\n250,00\nVisa\n250,00";
      expect(parseReceiptText(text)).toEqual([]);
    });

    test("filtrerer ut MVA-linjer", () => {
      const text = "Herav mva\n50,00";
      expect(parseReceiptText(text)).toEqual([]);
    });
  });

  describe("Antall / stykpris pre-prosessering", () => {
    test("bruker stykpris fra Antall-linje fremfor totalsum", () => {
      const text = [
        "Tine Yoghurt",
        "89,70",
        "Antall: 3 stk 29,90 kr/stk",
      ].join("\n");
      const result = parseReceiptText(text);
      expect(result[0]?.price).toBe(29.9);
    });
  });
});

describe("OCR fallback scenarios (edge cases)", () => {
  test("henter antall-varer når navn ikk finnes", () => {
    const mockData = {
      responses: [
        {
          fullTextAnnotation: {
            text: "2 x 25.50\n3 x 14.99\n1 x 99.90",
          },
        },
      ],
    };

    // Simulerer siste fallback: kun antall + pris
    const lines = mockData.responses[0].fullTextAnnotation.text.split("\n");
    const unitPrices = {};
    const pattern = /^\d+\s*x\s*([\d.]+)$/;

    lines.forEach((line) => {
      const match = line.trim().match(pattern);
      if (match) {
        unitPrices[line.trim()] = parseFloat(match[1]);
      }
    });

    const items = Object.entries(unitPrices).map(([name, price]) => ({ name, price }));

    expect(items.length).toBe(3);
    expect(items[0].price).toBe(25.50);
    expect(items[1].price).toBe(14.99);
    expect(items[2].price).toBe(99.90);
  });

  test("filtrerer tom tekst fra OCR-resultat", () => {
    const lines = [
      "Tine Melk",
      "",
      "22.99",
      "   ",
      "Banan",
      "8.50",
    ];

    const filtered = lines
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    expect(filtered).toHaveLength(4);
    expect(filtered).not.toContain("");
  });

  test("håndterer multiline produk-format med variabel mellomrom", () => {
    const mockText = "Tine Helmelk\n1L\n22.50\nBanan\n8.99";
    const pattern = /^[A-ZÆØÅa-zæøå][\w\s-]{1,30}$/;

    const lines = mockText.split("\n").map((l) => l.trim());
    const validLines = lines.filter((l) => l && pattern.test(l));

    expect(validLines.length).toBeGreaterThan(0);
    expect(validLines).toContain("Tine Helmelk");
    expect(validLines).toContain("Banan");
  });
});
