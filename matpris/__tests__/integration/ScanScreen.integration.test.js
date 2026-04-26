import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ScanScreen from "../../src/screens/ScanScreen";
import { runOCR } from "../../src/utils/ocr";

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
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe("ScanScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require("expo-camera").useCameraPermissions.mockReturnValue([
      { granted: true },
      jest.fn(),
    ]);
  });

  test("viser kameravisning med fangstknapp (steg 0)", () => {
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.getByTestId("capture-btn")).toBeTruthy();
  });

  test("viser tilgangsforespørsel når kameratilgang mangler", () => {
    require("expo-camera").useCameraPermissions.mockReturnValueOnce([
      { granted: false },
      jest.fn(),
    ]);
    render(<ScanScreen onGoBack={jest.fn()} onScanComplete={jest.fn()} />);
    expect(screen.getByText("Gi tilgang til kamera")).toBeTruthy();
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
});
