import { act, render, screen, waitFor } from "@testing-library/react-native";
import App from "../../App";

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
}));

jest.mock("../../src/utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
    },
  },
}));

jest.mock("../../src/screens/LoginScreen", () => {
  const { Text } = require("react-native");
  return function MockLoginScreen() {
    return <Text>LOGIN_SCREEN</Text>;
  };
});

jest.mock("../../src/screens/HomeScreen", () => {
  const { Text } = require("react-native");
  return function MockHomeScreen() {
    return <Text>HOME_SCREEN</Text>;
  };
});

jest.mock("../../src/screens/TilbudScreen", () => {
  const { Text } = require("react-native");
  return function MockDealsScreen() {
    return <Text>DEALS_SCREEN</Text>;
  };
});

jest.mock("../../src/screens/ScanScreen", () => {
  const { Text } = require("react-native");
  return function MockScanScreen() {
    return <Text>SCAN_SCREEN</Text>;
  };
});

jest.mock("../../src/screens/ProfileScreen", () => {
  const { Text } = require("react-native");
  return function MockProfileScreen() {
    return <Text>PROFILE_SCREEN</Text>;
  };
});

describe("App auth flow (top-level)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  test("viser login når session mangler", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN_SCREEN")).toBeTruthy();
    });
  });

  test("går fra login til app etter auth state change", async () => {
    let authCallback;
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN_SCREEN")).toBeTruthy();
    });

    await act(async () => {
      authCallback("SIGNED_IN", { user: { id: "u1" } });
    });

    await waitFor(() => {
      expect(screen.queryByText("LOGIN_SCREEN")).toBeNull();
      expect(screen.getByText("HOME_SCREEN")).toBeTruthy();
      expect(screen.getByText("DEALS_SCREEN")).toBeTruthy();
      expect(screen.getByText("SCAN_SCREEN")).toBeTruthy();
      expect(screen.getByText("PROFILE_SCREEN")).toBeTruthy();
    });
  });
});
