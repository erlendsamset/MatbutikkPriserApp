import { fireEvent, render, screen } from "@testing-library/react-native";
import ProductDetail from "../../src/components/ProductDetail";

const product = {
  id: "1",
  name: "Tine Helmelk 1L",
  category: "Meieri",
  prices: { rema: 22.9, kiwi: 24.9, meny: 27.5 },
};

describe("ProductDetail (integration)", () => {
  test("viser produktnavn og billigste pris", () => {
    render(<ProductDetail product={product} visible={true} onClose={jest.fn()} />);
    expect(screen.getByText("Tine Helmelk 1L")).toBeTruthy();
    expect(screen.getByText("Billigst hos")).toBeTruthy();
    // Prisen vises både i highlight-boks og prisoversikt
    expect(screen.getAllByText("22.90 kr").length).toBeGreaterThanOrEqual(1);
  });

  test("viser BILLIGST-badge og riktig butikknavn", () => {
    render(<ProductDetail product={product} visible={true} onClose={jest.fn()} />);
    expect(screen.getByText("BILLIGST")).toBeTruthy();
    // "Rema 1000" vises i highlight-boks og i prisoversikt
    expect(screen.getAllByText("Rema 1000").length).toBeGreaterThanOrEqual(1);
  });

  test("viser alle butikker i listen", () => {
    render(<ProductDetail product={product} visible={true} onClose={jest.fn()} />);
    expect(screen.getByText("Alle priser (3 butikker)")).toBeTruthy();
    expect(screen.getByText("Kiwi")).toBeTruthy();
    expect(screen.getByText("Meny")).toBeTruthy();
  });

  test("kaller onClose ved trykk på lukk-knapp", () => {
    const onClose = jest.fn();
    render(<ProductDetail product={product} visible={true} onClose={onClose} />);
    fireEvent.press(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
