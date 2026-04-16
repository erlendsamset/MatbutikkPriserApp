// src/screens/ScanScreen.js

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { STORES, COLORS, MOCK_RECEIPT_ITEMS } from "../utils/constants";

export default function ScanScreen({ onGoBack, totalScans, onScanComplete }) {
  const [step, setStep] = useState(0); // 0=camera, 1=store, 2=review, 3=done
  const [selectedStore, setSelectedStore] = useState(null);
  const [items, setItems] = useState([]);
  const [photo, setPhoto] = useState(null);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Appen trenger tilgang til kameraet.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      setItems(MOCK_RECEIPT_ITEMS);
      setStep(1);
    }
  };

  const handleSelectStore = (storeKey) => {
    setSelectedStore(storeKey);
    setStep(2);
  };

  const handleSubmit = () => {
    setStep(3);
    onScanComplete();
  };

  const handleDone = () => {
    setStep(0);
    setSelectedStore(null);
    setItems([]);
    setPhoto(null);
    onGoBack();
  };

  // Step 0: Camera
  if (step === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
          <Text style={styles.backText}>← Tilbake</Text>
        </TouchableOpacity>

        <View style={styles.cameraBox}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Trykk for å ta bilde</Text>
          <Text style={styles.cameraHint}>
            Hold kvitteringen innenfor rammen
          </Text>
        </View>

        <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto}>
          <Text style={styles.captureBtnText}>📸 Ta bilde av kvittering</Text>
        </TouchableOpacity>

        <Text style={styles.scanCount}>
          Du har skannet {totalScans} kvitteringer denne måneden
        </Text>
      </View>
    );
  }

  // Step 1: Select store
  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
          <Text style={styles.backText}>← Tilbake</Text>
        </TouchableOpacity>

        {photo && (
          <Image source={{ uri: photo }} style={styles.photoPreview} />
        )}

        <Text style={styles.stepTitle}>Hvilken butikk?</Text>
        <Text style={styles.stepDesc}>
          Velg butikken kvitteringen er fra
        </Text>

        <View style={styles.storeGrid}>
          {Object.entries(STORES).map(([key, store]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.storeCard,
                {
                  backgroundColor: store.bg,
                  borderColor: store.color + "22",
                },
              ]}
              onPress={() => handleSelectStore(key)}
            >
              <View
                style={[styles.storeDot, { backgroundColor: store.color }]}
              />
              <Text style={[styles.storeName, { color: store.color }]}>
                {store.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Step 2: Review items
  if (step === 2) {
    const storeInfo = STORES[selectedStore];
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={styles.backText}>← Tilbake</Text>
        </TouchableOpacity>

        {photo && (
          <Image source={{ uri: photo }} style={styles.photoPreview} />
        )}

        <View style={styles.reviewHeader}>
          <View
            style={[styles.storeDotLg, { backgroundColor: storeInfo?.color }]}
          />
          <Text style={styles.stepTitle}>Bekreft varer</Text>
        </View>

        <Text style={styles.stepDesc}>
          {items.length} varer fra {storeInfo?.name}
        </Text>

        {items.map((item, i) => (
          <View key={i} style={styles.reviewItem}>
            <View style={styles.reviewItemLeft}>
              <Text style={styles.checkmark}>✅</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.itemPrice}>{item.price.toFixed(2)} kr</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            ✓ Send inn {items.length} priser
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3: Success
  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Takk!</Text>
      <Text style={styles.successText}>
        {items.length} priser lagt til fra {STORES[selectedStore]?.name}
      </Text>
      <Text style={styles.successHint}>
        Din tilgang er aktiv i 30 dager til
      </Text>
      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneBtnText}>Tilbake til søk</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  cameraBox: {
    height: 360,
    backgroundColor: "#1A2E1D",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(107,155,30,0.4)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  cameraIcon: {
    fontSize: 56,
    marginBottom: 12,
    opacity: 0.8,
  },
  cameraText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  cameraHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 4,
  },
  captureBtn: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  captureBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scanCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
    resizeMode: "cover",
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    color: "#7A8068",
    marginBottom: 20,
  },
  storeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  storeCard: {
    width: "47%",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
  },
  storeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  storeDotLg: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkmark: {
    fontSize: 16,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.text,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  successHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  doneBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
