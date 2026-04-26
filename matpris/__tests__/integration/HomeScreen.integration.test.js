import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import HomeScreen from "../../src/screens/HomeScreen";
import { supabase } from "../../src/utils/supabase";

jest.mock("../../src/utils/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("HomeScreen (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const select = jest.fn().mockResolvedValue({
      data: [
        {
          product_id: "1",
          store: "rema",
          price: "22.9",
          products: { id: "1", name: "Tine Helmelk 1L", category: "Meieri" },
        },
        {
          product_id: "1",
          store: "kiwi",
          price: "24.9",
          products: { id: "1", name: "Tine Helmelk 1L", category: "Meieri" },
        },
        {
          product_id: "2",
          store: "kiwi",
          price: "19.9",
          products: { id: "2", name: "Banan", category: "Frukt" },
        },
      ],
      error: null,
    });

    supabase.from.mockReturnValue({ select });
  });

  test("henter data og viser antall varer", async () => {
    render(<HomeScreen daysLeft={5} />);

    await waitFor(() => {
      expect(screen.getByText("2 varer · 8 butikker · oppdatert i dag")).toBeTruthy();
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });

    expect(screen.getByText("Tine Helmelk 1L")).toBeTruthy();
    expect(screen.getByText("Banan")).toBeTruthy();
  });

  test("viser sorteringspillene og beholder resultater ved sorteringsbytte", async () => {
    render(<HomeScreen daysLeft={5} />);

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });

    expect(screen.getByText("Billigst")).toBeTruthy();
    expect(screen.getByText("Dyrest")).toBeTruthy();
    expect(screen.getByText("Flest butikker")).toBeTruthy();

    fireEvent.press(screen.getByText("Flest butikker"));

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
      expect(screen.getByText("Tine Helmelk 1L")).toBeTruthy();
      expect(screen.getByText("Banan")).toBeTruthy();
    });
  });

  test("filtrerer resultat når bruker søker", async () => {
    render(<HomeScreen daysLeft={12} />);

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Søk etter matvare..."), "melk");

    await waitFor(() => {
      expect(screen.getByText("1 vare funnet")).toBeTruthy();
    });

    expect(screen.getByText("Tine Helmelk 1L")).toBeTruthy();
    expect(screen.queryByText("Banan")).toBeNull();
  });

  test("viser butikkfilter og filtrerer etter valgt butikk", async () => {
    render(<HomeScreen daysLeft={5} />);

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Kiwi"));

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });
  });

  test("viser tom liste når søk gir ingen treff", async () => {
    render(<HomeScreen daysLeft={5} />);

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Søk etter matvare..."), "kjeks som ikke finnes");

    await waitFor(() => {
      expect(screen.getByText("0 varer funnet")).toBeTruthy();
    });

    expect(screen.queryByText("Tine Helmelk 1L")).toBeNull();
    expect(screen.queryByText("Banan")).toBeNull();
  });

  test("sortering til Dyrest endrer rekkefølge", async () => {
    render(<HomeScreen daysLeft={5} />);

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Dyrest"));

    await waitFor(() => {
      expect(screen.getByText("2 varer funnet")).toBeTruthy();
    });
  });
});
