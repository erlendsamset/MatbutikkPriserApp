import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ScanScreen from "../../src/screens/ScanScreen";
import { runOCR } from "../../src/utils/ocr";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockCameraRequestPermission = jest.fn();

let mockAliasesData = [];
let mockReceiptResult = { data: { id: "receipt-1" }, error: null };
let mockProductResult = { data: { id: "product-new-1" }, error: null };
let mockPricesSelectResult = { data: [], error: null };

const mockReceiptsInsert = jest.fn();
const mockProductAliasesInsert = jest.fn();
const mockProductsInsert = jest.fn();
const mockPricesInsert = jest.fn();
const mockPricesIn = jest.fn();

function buildQuery(table) {
  return {
    insert: jest.fn((payload) => {
      if (table === "receipts") {
        mockReceiptsInsert(payload);
        return {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue(mockReceiptResult),
          })),
        };
      }

      if (table === "products") {
        mockProductsInsert(payload);
        return {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue(mockProductResult),
          })),
        };
      }

      if (table === "product_aliases") {
        mockProductAliasesInsert(payload);
        return Promise.resolve({ data: null, error: null });
      }

      if (table === "prices") {
        mockPricesInsert(payload);
        return Promise.resolve({ data: null, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    }),
    select: jest.fn(() => {
      if (table === "product_aliases") {
        return Promise.resolve({ data: mockAliasesData, error: null });
      }

      if (table === "prices") {
        return {
          in: jest.fn((field, ids) => {
            mockPricesIn(field, ids);
            return Promise.resolve(mockPricesSelectResult);
          }),
        };
      }

      return Promise.resolve({ data: [], error: null });
    }),
  };
}

function defaultMocks() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
  mockAliasesData = [];
  mockReceiptResult = { data: { id: "receipt-1" }, error: null };
  mockProductResult = { data: { id: "product-new-1" }, error: null };
  mockPricesSelectResult = { data: [], error: null };
  mockFrom.mockImplementation((table) => buildQuery(table));
}

jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CameraView: React.forwardRef(({ children }, ref) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn().mockResolvedValue({ uri: "file://mock.jpg" }),
      }));
      return React.createElement(View, {}, children);
    }),
    useCameraPermissions: jest.fn(),
  };
});

jest.mock("../../src/utils/ocr", () => ({
  runOCR: jest.fn(),
}));

jest.mock("../../src/utils/supabase", () => ({
  supabase: {
    auth: { getUser: (...args) => mockGetUser(...args) },
    from: (...args) => mockFrom(...args),
  },
}));

describe("ScanScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultMocks();
    require("expo-camera").useCameraPermissions.mockReturnValue([
      { granted: true },
      mockCameraRequestPermission,
    ]);
  });

  test("viser kameravisning med fangstknapp (steg 0)", () => {
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.getByTestId("capture-btn")).toBeTruthy();
  });

  test("viser tilgangsforespørsel når kameratilgang mangler", () => {
    require("expo-camera").useCameraPermissions.mockReturnValueOnce([
      { granted: false },
      mockCameraRequestPermission,
    ]);
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.getByText("Gi tilgang til kamera")).toBeTruthy();
  });

  test("ber om kameratilgang når bruker trykker på tilgangsknappen", () => {
    require("expo-camera").useCameraPermissions.mockReturnValueOnce([
      { granted: false },
      mockCameraRequestPermission,
    ]);
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);

    fireEvent.press(screen.getByText("Gi tilgang til kamera"));
    expect(mockCameraRequestPermission).toHaveBeenCalledTimes(1);
  });

  test("viser tom container når kamera-permission fortsatt lastes", () => {
    require("expo-camera").useCameraPermissions.mockReturnValueOnce([null, mockCameraRequestPermission]);
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.queryByTestId("capture-btn")).toBeNull();
    expect(screen.queryByText("Kameratilgang")).toBeNull();
  });

  test("går til butikkvalg etter at bilde er tatt og OCR er ferdig", async () => {
    runOCR.mockResolvedValue([
      { name: "Tine Helmelk 1L", price: 22.9 },
      { name: "Banan", price: 8.9 },
    ]);

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);

    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => {
      expect(screen.getByText("Hvilken butikk?")).toBeTruthy();
    });
  });

  test("viser innleste varer etter butikkvalg", async () => {
    runOCR.mockResolvedValue([
      { name: "Tine Helmelk 1L", price: 22.9 },
      { name: "Banan", price: 8.9 },
    ]);

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);

    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => screen.getByText("Rema 1000"));
    fireEvent.press(screen.getByText("Rema 1000"));

    await waitFor(() => {
      expect(screen.getByText("Tine Helmelk 1L")).toBeTruthy();
      expect(screen.getByText("Banan")).toBeTruthy();
      expect(screen.getByText("Bekreft varer")).toBeTruthy();
    });
  });

  test("viser hint-tekst over kamerarammen", () => {
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.getByText("Hold kvitteringen innenfor rammen")).toBeTruthy();
  });

  test("viser tilbake-knapp ved steg 0", () => {
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.getByText("← Tilbake")).toBeTruthy();
  });

  test("kaller onGoBack når bruker trykker tilbake-knapp", () => {
    const onGoBack = jest.fn();
    render(<ScanScreen onGoBack={onGoBack} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByText("← Tilbake"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  test("viser alle tilgjengelige butikker ved steg 1", async () => {
    runOCR.mockResolvedValue([
      { name: "Tine Helmelk 1L", price: 22.9 },
    ]);

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);

    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => {
      expect(screen.getByText("Rema 1000")).toBeTruthy();
      expect(screen.getByText("Kiwi")).toBeTruthy();
      expect(screen.getByText("Meny")).toBeTruthy();
    });
  });

  test("lager sammenligning når innsending skjer uten innlogget bruker", async () => {
    runOCR.mockResolvedValue([
      { name: "Tine Helmelk 1L", price: 25.0 },
      { name: "Banan", price: 20.0 },
    ]);
    mockAliasesData = [
      { alias: "Tine Helmelk 1L", product_id: "p1" },
      { alias: "Banan", product_id: "p2" },
    ];
    mockPricesSelectResult = {
      data: [
        { store: "kiwi", product_id: "p1", price: 12 },
        { store: "kiwi", product_id: "p2", price: 18 },
        { store: "rema", product_id: "p1", price: 14 },
        { store: "rema", product_id: "p2", price: 21 },
      ],
      error: null,
    };

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => screen.getByText("Rema 1000"));
    fireEvent.press(screen.getByText("Rema 1000"));
    await waitFor(() => screen.getByText("✓ Send inn 2 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 2 priser"));

    await waitFor(() => {
      expect(screen.getByText("Samme handletur hos andre butikker")).toBeTruthy();
      expect(screen.getByText("Du kunne spart 5 kr hos Kiwi")).toBeTruthy();
      expect(screen.getByText("din butikk")).toBeTruthy();
      expect(screen.getByText("billigst")).toBeTruthy();
    });
    expect(mockPricesIn).toHaveBeenCalledWith("product_id", ["p1", "p2"]);
  });

  test("sender priser til backend for innlogget bruker med alias-oppslag og nye produkter", async () => {
    const onScanComplete = jest.fn();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    runOCR.mockResolvedValue([
      { name: "Bannn", price: 20.0 },
      { name: "Ny Vare", price: 33.0 },
    ]);
    mockAliasesData = [{ alias: "Banan", product_id: "p-existing" }];
    mockProductResult = { data: { id: "p-new" }, error: null };
    mockPricesSelectResult = {
      data: [
        { store: "kiwi", product_id: "p-existing", price: 20 },
        { store: "kiwi", product_id: "p-new", price: 33 },
        { store: "rema", product_id: "p-existing", price: 24 },
      ],
      error: null,
    };

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={onScanComplete} />);
    fireEvent.press(screen.getByTestId("capture-btn"));
    await waitFor(() => screen.getByText("Rema 1000"));

    fireEvent.press(screen.getByText("Rema 1000"));
    await waitFor(() => screen.getByText("✓ Send inn 2 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 2 priser"));

    await waitFor(() => {
      expect(onScanComplete).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Takk!")).toBeTruthy();
    });

    expect(mockReceiptsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        chain: "rema",
        item_count: 2,
        total_amount: 53,
        status: "processed",
      })
    );
    expect(mockProductAliasesInsert).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: "p-existing", alias: "Bannn", store: "rema" })
    );
    expect(mockProductsInsert).toHaveBeenCalledWith({ name: "Ny Vare" });
    expect(mockPricesInsert).toHaveBeenCalledWith([
      { product_id: "p-existing", store: "rema", price: 20 },
      { product_id: "p-new", store: "rema", price: 33 },
    ]);
  });

  test("viser takkeskjerm uten sammenligningsboks når prisgrunnlaget er for tynt", async () => {
    runOCR.mockResolvedValue([{ name: "Test Vare", price: 15 }]);
    mockAliasesData = [{ alias: "Test Vare", product_id: "p1" }];
    mockPricesSelectResult = {
      data: [{ store: "rema", product_id: "p1", price: 15 }],
      error: null,
    };

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByTestId("capture-btn"));
    await waitFor(() => screen.getByText("Rema 1000"));
    fireEvent.press(screen.getByText("Rema 1000"));
    await waitFor(() => screen.getByText("✓ Send inn 1 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 1 priser"));

    await waitFor(() => {
      expect(screen.getByText("Takk!")).toBeTruthy();
    });
    expect(screen.queryByText("Samme handletur hos andre butikker")).toBeNull();
  });

  test("tilbake til søk kaller onGoBack fra takkeskjermen", async () => {
    const onGoBack = jest.fn();
    runOCR.mockResolvedValue([{ name: "Vare", price: 9 }]);
    mockAliasesData = [{ alias: "Vare", product_id: "p1" }];
    mockPricesSelectResult = {
      data: [{ store: "kiwi", product_id: "p1", price: 9 }],
      error: null,
    };

    render(<ScanScreen onGoBack={onGoBack} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByTestId("capture-btn"));
    await waitFor(() => screen.getByText("Kiwi"));
    fireEvent.press(screen.getByText("Kiwi"));
    await waitFor(() => screen.getByText("✓ Send inn 1 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 1 priser"));
    await waitFor(() => screen.getByText("Tilbake til søk"));

    fireEvent.press(screen.getByText("Tilbake til søk"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });
});

  test("viser estimerte prissammenligninger når det ikke finnes data fra databasen", async () => {
    runOCR.mockResolvedValue([
      { name: "Helt ny vare", price: 100.0 },
    ]);
    mockAliasesData = [];
    mockPricesSelectResult = { data: [], error: null };

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => screen.getByText("Rema 1000"));
    fireEvent.press(screen.getByText("Rema 1000"));
    await waitFor(() => screen.getByText("✓ Send inn 1 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 1 priser"));

    await waitFor(() => {
      expect(screen.getByText("Samme handletur hos andre butikker")).toBeTruthy();
      expect(screen.getByText("billigst")).toBeTruthy();
    });

    const prices = screen.getAllByTestId("comp-price");
    expect(prices.length).toBeGreaterThan(1);
  });

  test("sorterer prissammenligninger fra billigste til dyreste", async () => {
    runOCR.mockResolvedValue([
      { name: "Tine Helmelk 1L", price: 25.0 },
      { name: "Banan", price: 20.0 },
    ]);
    mockAliasesData = [];
    mockPricesSelectResult = { data: [], error: null };

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => screen.getByText("Rema 1000"));
    fireEvent.press(screen.getByText("Rema 1000"));
    await waitFor(() => screen.getByText("✓ Send inn 2 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 2 priser"));

    await waitFor(() => {
      const storeNames = screen.getAllByTestId("store-name");
      expect(storeNames[0].children[0]).toBe("Bunnpris");
    });
  });

  test("viser sparingsbeløp for hver butikk som ikke er billigst", async () => {
    runOCR.mockResolvedValue([
      { name: "Tine Helmelk 1L", price: 25.0 },
    ]);
    mockAliasesData = [];
    mockPricesSelectResult = { data: [], error: null };

    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    fireEvent.press(screen.getByTestId("capture-btn"));

    await waitFor(() => screen.getByText("Rema 1000"));
    fireEvent.press(screen.getByText("Rema 1000"));
    await waitFor(() => screen.getByText("✓ Send inn 1 priser"));
    fireEvent.press(screen.getByText("✓ Send inn 1 priser"));

    await waitFor(() => {
      const savingsTags = screen.queryAllByText(/\+\d+\.\d+ kr/);
      expect(savingsTags.length).toBeGreaterThan(0);
    });
  });
