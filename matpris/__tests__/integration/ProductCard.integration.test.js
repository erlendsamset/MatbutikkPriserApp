import { fireEvent, render, screen } from "@testing-library/react-native";
import ProductCard from "../../src/components/ProductCard";

const product = {
  id: "1",
  name: "Tine Helmelk 1L",
  category: "Meieri",
  prices: { rema: 22.9, kiwi: 24.9, meny: 27.5 },
};

describe("ProductCard (integration)", () => {
  test("viser produktnavn, kategori og billigste pris", () => {
    render(<ProductCard product={product} selectedStore="all" onPress={jest.fn()} />);
    expect(screen.getByText("Tine Helmelk 1L")).toBeTruthy();
    expect(screen.getByText("Meieri")).toBeTruthy();
    expect(screen.getByText("22.90")).toBeTruthy();
  });

  test("viser valgt butikks pris når en butikk er filtrert", () => {
    render(<ProductCard product={product} selectedStore="meny" onPress={jest.fn()} />);
    expect(screen.getByText("27.50")).toBeTruthy();
  });

  test("viser dyreste pris når ingen butikk er valgt og det finnes flere priser", () => {
    render(<ProductCard product={product} selectedStore="all" onPress={jest.fn()} />);
    expect(screen.getByText("Dyreste: 27.50 kr")).toBeTruthy();
  });

  test("kaller onPress når kortet trykkes", () => {
    const onPress = jest.fn();
    render(<ProductCard product={product} selectedStore="all" onPress={onPress} />);
    fireEvent.press(screen.getByText("Tine Helmelk 1L"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
