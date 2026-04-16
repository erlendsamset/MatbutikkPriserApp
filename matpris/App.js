// App.js

import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./src/screens/HomeScreen";
import ScanScreen from "./src/screens/ScanScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BottomNav from "./src/components/BottomNav";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [daysLeft, setDaysLeft] = useState(24);
  const [totalScans, setTotalScans] = useState(3);

  const handleScanComplete = () => {
    setTotalScans((s) => s + 1);
    setDaysLeft(30);
  };

  const renderScreen = () => {
    switch (screen) {
      case "scan":
        return (
          <ScanScreen
            onGoBack={() => setScreen("home")}
            totalScans={totalScans}
            onScanComplete={handleScanComplete}
          />
        );
      case "profile":
        return <ProfileScreen daysLeft={daysLeft} totalScans={totalScans} />;
      default:
        return <HomeScreen daysLeft={daysLeft} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        {renderScreen()}
        <BottomNav activeScreen={screen} onNavigate={setScreen} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBF7",
  },
});
