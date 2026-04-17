// src/screens/ScanScreen.js

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { STORES, COLORS, MOCK_RECEIPT_ITEMS } from "../utils/constants";
import { supabase } from "../utils/supabase";

export default function ScanScreen({ onGoBack, totalScans, onScanComplete }) {
  const [step, setStep] = useState(0); // 0=camera, 1=store, 2=review, 3=done
  const [selectedStore, setSelectedStore] = useState(null);
  const [items, setItems] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [storeTotals, setStoreTotals] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

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

  const handleSubmit = async () => {
    setStep(3);
    onScanComplete();
    await fetchStoreTotals();
  };

  const fetchStoreTotals = async () => {
    setLoadingComparison(true);

    const itemNames = items.map((i) => i.name);

    // Hent produkt-IDer som matcher varenavn
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name")
      .in("name", itemNames);

    if (prodError || !products?.length) {
      setLoadingComparison(false);
      return;
    }

    const productIds = products.map((p) => p.id);

    // Hent priser for disse produktene
    const { data: prices, error: priceError } = await supabase
      .from("prices")
      .select("store, price, product_id")
      .in("product_id", productIds);

    if (priceError || !prices?.length) {
      setLoadingComparison(false);
      return;
    }

    // Bygg opp totalpris per butikk
    const totals = {};
    const counts = {};

    for (const row of prices) {
      if (!totals[row.store]) {
        totals[row.store] = 0;
        counts[row.store] = 0;
      }
      totals[row.store] += parseFloat(row.price);
      counts[row.store]++;
    }

    // Kun butikker som har minst 60% av varene
    const maxCount = Math.max(...Object.values(counts));
    const sorted = Object.entries(totals)
      .filter(([store]) => counts[store] >= maxCount * 0.6)
      .map(([store, total]) => ({ store, total }))
      .sort((a, b) => a.total - b.total);

    setStoreTotals(sorted);
    setLoadingComparison(false);
  };

  const handleDone = () => {
    setStep(0);
    setSelectedStore(null);
    setItems([]);
    setPhoto(null);
    setStoreTotals([]);
    onGoBack();
  };

  const receiptTotal = items.reduce((sum, i) => sum + i.price, 0);

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

        {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}

        <Text style={styles.stepTitle}>Hvilken butikk?</Text>
        <Text style={styles.stepDesc}>Velg butikken kvitteringen er fra</Text>

        <View style={styles.storeGrid}>
          {Object.entries(STORES).map(([key, store]) => (
            <TouchableOpacity
              key={key}
              style={[styles.storeCard, { backgroundColor: store.bg, borderColor: store.color + "22" }]}
              onPress={() => handleSelectStore(key)}
            >
              <View style={[styles.storeDot, { backgroundColor: store.color }]} />
              <Text style={[styles.storeName, { color: store.color }]}>{store.name}</Text>
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

        {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}

        <View style={styles.reviewHeader}>
          <View style={[styles.storeDotLg, { backgroundColor: storeInfo?.color }]} />
          <Text style={styles.stepTitle}>Bekreft varer</Text>
        </View>
        <Text style={styles.stepDesc}>{items.length} varer fra {storeInfo?.name}</Text>

        {items.map((item, i) => (
          <View key={i} style={styles.reviewItem}>
            <View style={styles.reviewItemLeft}>
              <Text style={styles.checkmark}>✅</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.itemPrice}>{item.price.toFixed(2)} kr</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Totalt</Text>
          <Text style={styles.totalAmount}>{receiptTotal.toFixed(2)} kr</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>✓ Send inn {items.length} priser</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3: Success + sammenligning
  const scannedStoreInfo = STORES[selectedStore];
  const cheapest = storeTotals[0];
  const scannedTotal = storeTotals.find((s) => s.store === selectedStore);
  const savings = scannedTotal && cheapest && cheapest.store !== selectedStore
    ? scannedTotal.total - cheapest.total
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.successScroll}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Takk!</Text>
      <Text style={styles.successText}>
        {items.length} priser lagt til fra {scannedStoreInfo?.name}
      </Text>

      {/* Totalsum for denne handleturen */}
      <View style={styles.totalCard}>
        <Text style={styles.totalCardLabel}>Du betalte</Text>
        <Text style={styles.totalCardAmount}>{receiptTotal.toFixed(2)} kr</Text>
        <Text style={styles.totalCardStore}>hos {scannedStoreInfo?.name}</Text>
      </View>

      {/* Butikksammenligning */}
      {loadingComparison ? (
        <ActivityIndicator size="small" color={COLORS.accent} style={{ marginTop: 20 }} />
      ) : storeTotals.length > 1 ? (
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>Samme handletur hos andre butikker</Text>

          {savings && (
            <View style={styles.savingsBanner}>
              <Text style={styles.savingsBannerText}>
                Du kunne spart {savings.toFixed(0)} kr hos {STORES[cheapest.store]?.name}
              </Text>
            </View>
          )}

          {storeTotals.map(({ store, total }) => {
            const storeInfo = STORES[store];
            const isCheapest = store === cheapest?.store;
            const isScanned = store === selectedStore;
            return (
              <View
                key={store}
                style={[
                  styles.comparisonRow,
                  isCheapest && styles.comparisonRowCheapest,
                ]}
              >
                <View style={styles.comparisonLeft}>
                  <View style={[styles.compDot, { backgroundColor: storeInfo?.color }]} />
                  <Text style={styles.compStoreName}>{storeInfo?.name}</Text>
                  {isScanned && <Text style={styles.compTag}>din butikk</Text>}
                  {isCheapest && !isScanned && <Text style={[styles.compTag, styles.compTagGreen]}>billigst</Text>}
                </View>
                <Text style={[styles.compTotal, isCheapest && styles.compTotalCheapest]}>
                  {total.toFixed(2)} kr
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneBtnText}>Tilbake til søk</Text>
      </TouchableOpacity>
    </ScrollView>
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
  successScroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
    alignItems: "center",
  },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 16, color: COLORS.textSecondary },
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
  cameraIcon: { fontSize: 56, marginBottom: 12, opacity: 0.8 },
  cameraText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  cameraHint: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 },
  captureBtn: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  captureBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scanCount: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 12 },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
    resizeMode: "cover",
  },
  stepTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  stepDesc: { fontSize: 13, color: "#7A8068", marginBottom: 20 },
  storeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  storeCard: {
    width: "47%",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
  },
  storeDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  storeDotLg: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  storeName: { fontSize: 14, fontWeight: "600" },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
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
  reviewItemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkmark: { fontSize: 16 },
  itemName: { fontSize: 14, color: COLORS.text },
  itemPrice: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    marginTop: 8,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  totalAmount: { fontSize: 15, fontWeight: "700", color: COLORS.accent },
  submitBtn: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successIcon: { fontSize: 64, marginBottom: 12 },
  successTitle: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  successText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  totalCard: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  totalCardLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  totalCardAmount: { fontSize: 36, fontWeight: "800", color: "#fff" },
  totalCardStore: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  comparisonBox: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  savingsBanner: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  savingsBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.accent,
    textAlign: "center",
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  comparisonRowCheapest: {
    backgroundColor: COLORS.accentLight,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  comparisonLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  compDot: { width: 8, height: 8, borderRadius: 4 },
  compStoreName: { fontSize: 14, color: COLORS.text },
  compTag: {
    fontSize: 10,
    color: COLORS.textMuted,
    backgroundColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compTagGreen: {
    color: COLORS.success,
    backgroundColor: COLORS.accentLight,
  },
  compTotal: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  compTotalCheapest: { color: COLORS.accent, fontWeight: "700" },
  doneBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
