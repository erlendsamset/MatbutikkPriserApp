// App.js

import { useState, useRef } from "react";
import { View, ScrollView, Dimensions, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./src/screens/HomeScreen";
import TilbudScreen from "./src/screens/TilbudScreen";
import ScanScreen from "./src/screens/ScanScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BottomNav from "./src/components/BottomNav";

const SCREENS = ["home", "deals", "scan", "profile"];
const { width } = Dimensions.get("window");

export default function App() {
  const [screen, setScreen] = useState("home");
  const [daysLeft, setDaysLeft] = useState(24);
  const [totalScans, setTotalScans] = useState(3);
  const scrollRef = useRef(null);

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
