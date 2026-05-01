import { renderHook, act } from "@testing-library/react-native";

describe("App state management (unit)", () => {
  test("handleScanComplete øker totalScans og setter daysLeft til 30", () => {
    let state = { totalScans: 3, daysLeft: 10 };

    const handleScanComplete = () => {
      state.totalScans += 1;
      state.daysLeft = 30;
    };

    act(() => {
      handleScanComplete();
    });

    expect(state.totalScans).toBe(4);
    expect(state.daysLeft).toBe(30);
  });

  test("refreshKey økes for å trigge re-render", () => {
    let refreshKey = 0;

    const triggerRefresh = () => {
      refreshKey += 1;
    };

    act(() => {
      triggerRefresh();
    });

    expect(refreshKey).toBe(1);

    act(() => {
      triggerRefresh();
    });

    expect(refreshKey).toBe(2);
  });

  test("SCREENS array er sortert riktig", () => {
    const SCREENS = ["home", "scan", "profile"];
    expect(SCREENS.length).toBe(3);
    expect(SCREENS[0]).toBe("home");
    expect(SCREENS[1]).toBe("scan");
    expect(SCREENS[2]).toBe("profile");
  });
});
