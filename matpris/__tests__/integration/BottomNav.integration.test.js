import { fireEvent, render, screen } from "@testing-library/react-native";
import BottomNav from "../../src/components/BottomNav";

describe("BottomNav (integration)", () => {
  test("viser alle tre faner", () => {
    render(<BottomNav activeScreen="home" onNavigate={jest.fn()} />);
    expect(screen.getByText("Søk")).toBeTruthy();
    expect(screen.getByText("Skann")).toBeTruthy();
    expect(screen.getByText("Profil")).toBeTruthy();
  });

  test("kaller onNavigate med riktig nøkkel ved trykk", () => {
    const onNavigate = jest.fn();
    render(<BottomNav activeScreen="home" onNavigate={onNavigate} />);
    fireEvent.press(screen.getByText("Profil"));
    expect(onNavigate).toHaveBeenCalledWith("profile");
  });

  test("aktiv fane vises med accentfarge", () => {
    render(<BottomNav activeScreen="scan" onNavigate={jest.fn()} />);
    expect(screen.getByText("Skann")).toHaveStyle({ color: "#1A4023" });
  });
});
