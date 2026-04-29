/*
 * App.js — Hovedinngang for appen
 *
 * Dette er rotkomponenten som React Native starter med.
 * Den gjør to ting:
 *   1. Sjekker om brukeren er innlogget via Supabase Auth. Hvis ikke, vises LoginScreen.
 *   2. Setter opp navigasjonen mellom de tre hovedskjermene (Søk, Skann, Profil)
 *      som en horisontal ScrollView man sveiper mellom — én skjerm per "side".
 *
 * State som bor her og sendes ned til skjermene:
 *   - session: Supabase-innloggingsøkt (null = ikke innlogget)
 *   - daysLeft: antall dager med aktiv tilgang (fornyes ved skanning)
 *   - totalScans: antall kvitteringer skannet denne måneden
 *   - refreshKey: økes etter en skanning slik at HomeScreen henter nye data
 */

import { useEffect, useState, useRef } from "react";
import { View, ScrollView, Dimensions, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import ScanScreen from "./src/screens/ScanScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BottomNav from "./src/components/BottomNav";
import { supabase } from "./src/utils/supabase";

const SCREENS = ["home", "scan", "profile"];
const { width } = Dimensions.get("window");

export default function App() {
  const [screen, setScreen] = useState("home");
  const [daysLeft, setDaysLeft] = useState(24);
  const [totalScans, setTotalScans] = useState(3);
  const [session, setSession] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleScanComplete = () => {
    setTotalScans((s) => s + 1);
    setDaysLeft(30);
    setRefreshKey((k) => k + 1);
  };

  const navigateTo = (key) => {
    const index = SCREENS.indexOf(key);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setScreen(key);
  };

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setScreen(SCREENS[index]);
  };

  if (authLoading) {
    return <SafeAreaProvider />;
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.pager}
        >
          <View style={styles.page}>
            <HomeScreen daysLeft={daysLeft} refreshKey={refreshKey} />
          </View>
          <View style={styles.page}>
            <ScanScreen
              onGoBack={() => navigateTo("home")}
              totalScans={totalScans}
              onScanComplete={handleScanComplete}
            />
          </View>
          <View style={styles.page}>
            <ProfileScreen daysLeft={daysLeft} totalScans={totalScans} />
          </View>
        </ScrollView>
        <BottomNav activeScreen={screen} onNavigate={navigateTo} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBF7",
  },
  pager: {
    flex: 1,
  },
  page: {
    width,
    flex: 1,
  },
});
