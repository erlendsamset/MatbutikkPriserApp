// App.js

import { useEffect, useState, useRef } from "react";
import { View, ScrollView, Dimensions, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import TilbudScreen from "./src/screens/TilbudScreen";
import ScanScreen from "./src/screens/ScanScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BottomNav from "./src/components/BottomNav";
import { supabase } from "./src/utils/supabase";

const SCREENS = ["home", "deals", "scan", "profile"];
const { width } = Dimensions.get("window");

export default function App() {
  const [screen, setScreen] = useState("home");
  const [daysLeft, setDaysLeft] = useState(24);
  const [totalScans, setTotalScans] = useState(3);
  const [session, setSession] = useState(null);
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
            <HomeScreen daysLeft={daysLeft} />
          </View>
          <View style={styles.page}>
            <TilbudScreen />
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
