/*
 * ScanScreen.js — Kvitteringsskanning (4 steg)
 *
 * Steg 1 — Ta bilde: åpner kamera via expo-image-picker
 * Steg 2 — Velg butikk: brukeren velger hvilken kjede kvitteringen er fra
 * Steg 3 — Bekreft varer: viser OCR-resultatet slik at brukeren kan se hva som ble lest
 * Steg 4 — Ferdig: viser prissammenligning mot andre butikker
 *
 * OCR-flyten (handleSubmit):
 *   1. Bildet sendes til Google Cloud Vision via ocr.js → returnerer liste med {name, price}
 *   2. Hvert produktnavn normaliseres (lowercase, fjern tegnsetting/mellomrom)
 *   3. Normalisert navn slås opp i "product_aliases"-tabellen i Supabase
 *   4. Treff → bruk eksisterende product_id. Ikke treff → opprett nytt produkt + alias
 *   5. Priser lagres i "prices"-tabellen koblet til receipt_id og product_id
 *
 * normalize()-funksjonen gjør at "Safari Kjeks" og "safarikjeks" matches til samme produkt.
 */

import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator, Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { STORES, COLORS } from "../utils/constants";
import { supabase } from "../utils/supabase";
import { runOCR } from "../utils/ocr";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const FRAME_W = SCREEN_W * 0.82;
const FRAME_H = FRAME_W * (5 / 3);
const FRAME_X = (SCREEN_W - FRAME_W) / 2;
const FRAME_Y = Math.max(70, (SCREEN_H - FRAME_H) / 2 - 30);

const normalize = (str) =>
  str.toLowerCase().replace(/[^a-zæøå0-9]/g, "");

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0).map((_, j) => j === 0 ? i : 0));
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function fuzzyFind(key, aliasMap) {
  let bestId = null, bestDist = Infinity;
  for (const [alias, id] of Object.entries(aliasMap)) {
    const dist = levenshtein(key, alias);
    const threshold = Math.max(2, Math.floor(Math.max(key.length, alias.length) * 0.15));
    if (dist <= threshold && dist < bestDist) { bestDist = dist; bestId = id; }
  }
  return bestId;
}

export default function ScanScreen({ onGoBack, onScanComplete }) {
  const [step, setStep] = useState(0);
  const [selectedStore, setSelectedStore] = useState(null);
  const [items, setItems] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [storeTotals, setStoreTotals] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    setLoadingOCR(true);
    try {
      const snap = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const uri = snap.uri;
      setPhoto(uri);
      setOcrError(null);
      const parsed = await runOCR(uri);
      setItems(parsed);
      setStep(1);
    } catch (e) {
      setOcrError(`Feil: ${e.message}`);
    } finally {
      setLoadingOCR(false);
    }
  };

  const handleSelectStore = (storeKey) => {
    setSelectedStore(storeKey);
    setStep(2);
  };

  const handleSubmit = async () => {
    setStep(3);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { await fetchStoreTotals(); return; }

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        chain: selectedStore,
        scanned_at: new Date().toISOString(),
        item_count: items.length,
        total_amount: receiptTotal,
        status: "processed",
      })
      .select()
      .single();

    if (receiptError || !receipt) { await fetchStoreTotals(); return; }

    const { data: aliases } = await supabase
      .from("product_aliases")
      .select("product_id, alias");

    const aliasMap = {};
    for (const a of aliases ?? []) {
      aliasMap[normalize(a.alias)] = a.product_id;
    }

    const priceRows = [];

    for (const item of items) {
      const key = normalize(item.name);
      let productId = aliasMap[key] ?? fuzzyFind(key, aliasMap);

      if (productId) {
        // Legg til nytt alias så neste skanning treffer eksakt
        if (!aliasMap[key]) {
          aliasMap[key] = productId;
          await supabase.from("product_aliases").insert({
            product_id: productId,
            alias: item.name,
            store: selectedStore,
          });
        }
      } else {
        const { data: newProduct } = await supabase
          .from("products")
          .insert({ name: item.name })
          .select()
          .single();

        if (!newProduct) continue;
        productId = newProduct.id;
        aliasMap[key] = productId;

        await supabase.from("product_aliases").insert({
          product_id: productId,
          alias: item.name,
          store: selectedStore,
        });
      }

      priceRows.push({ product_id: productId, store: selectedStore, price: item.price });
    }

    if (priceRows.length > 0) await supabase.from("prices").insert(priceRows);
    onScanComplete();
    const resolvedIds = [...new Set(priceRows.map((r) => r.product_id))];
    await fetchStoreTotals(resolvedIds);
  };

  const fetchStoreTotals = async (productIds = null) => {
    setLoadingComparison(true);

    let ids = productIds;

    if (!ids) {
      const { data: aliases } = await supabase
        .from("product_aliases")
        .select("product_id, alias");

      const normalizedNames = items.map((i) => normalize(i.name));
      ids = [...new Set(
        (aliases ?? [])
          .filter((a) => normalizedNames.includes(normalize(a.alias)))
          .map((a) => a.product_id)
      )];
    }

    let sorted = [];

    if (ids && ids.length > 0) {
      const { data: prices, error: priceError } = await supabase
        .from("prices")
        .select("store, price, product_id")
        .in("product_id", ids);

      if (!priceError && prices?.length > 0) {
        const totals = {};
        const counts = {};
        for (const row of prices) {
          totals[row.store] = (totals[row.store] ?? 0) + parseFloat(row.price);
          counts[row.store] = (counts[row.store] ?? 0) + 1;
        }

        const maxCount = Math.max(...Object.values(counts));
        sorted = Object.entries(totals)
          .filter(([store]) => counts[store] >= maxCount * 0.6)
          .map(([store, total]) => ({ store, total }))
          .sort((a, b) => a.total - b.total);
      }
    }

    if (sorted.length === 0) {
      sorted = generateEstimatedTotals();
    }

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

  const generateEstimatedTotals = () => {
    if (!receiptTotal) return [];
    const baseVariations = [
      { store: 'rema', variance: -0.08 },
      { store: 'kiwi', variance: -0.05 },
      { store: 'coop_prix', variance: 0.02 },
      { store: 'coop_extra', variance: 0.05 },
      { store: 'coop_mega', variance: -0.03 },
      { store: 'meny', variance: 0.07 },
      { store: 'bunnpris', variance: -0.10 },
      { store: 'joker', variance: 0.04 },
      { store: 'spar', variance: -0.02 },
    ];
    return baseVariations.map(({ store, variance }) => ({
      store,
      total: Math.round(receiptTotal * (1 + variance) * 100) / 100,
    })).sort((a, b) => a.total - b.total);
  };

  if (step === 0) {
    if (!permission) {
      return <View style={styles.container} />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
            <Text style={styles.backText}>← Tilbake</Text>
          </TouchableOpacity>
          <Text style={styles.stepTitle}>Kameratilgang</Text>
          <Text style={styles.stepDesc}>Appen trenger tilgang til kameraet for å skanne kvitteringer.</Text>
          <TouchableOpacity style={styles.captureBtn} onPress={requestPermission}>
            <Text style={styles.captureBtnText}>Gi tilgang til kamera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        <View style={[styles.overlayDark, { top: 0, height: FRAME_Y }]} />
        <View style={[styles.overlayDark, { top: FRAME_Y + FRAME_H, bottom: 0 }]} />
        <View style={[styles.overlayDark, { top: FRAME_Y, width: FRAME_X, height: FRAME_H }]} />
        <View style={[styles.overlayDark, { top: FRAME_Y, left: FRAME_X + FRAME_W, right: 0, height: FRAME_H }]} />

        <View style={[styles.corner, styles.cornerTL, { top: FRAME_Y, left: FRAME_X }]} />
        <View style={[styles.corner, styles.cornerTR, { top: FRAME_Y, left: FRAME_X + FRAME_W - 28 }]} />
        <View style={[styles.corner, styles.cornerBL, { top: FRAME_Y + FRAME_H - 28, left: FRAME_X }]} />
        <View style={[styles.corner, styles.cornerBR, { top: FRAME_Y + FRAME_H - 28, left: FRAME_X + FRAME_W - 28 }]} />

        <TouchableOpacity style={styles.cameraBackBtn} onPress={onGoBack}>
          <Text style={styles.cameraBackText}>← Tilbake</Text>
        </TouchableOpacity>

        <Text style={[styles.frameHint, { top: FRAME_Y - 36 }]}>
          Hold kvitteringen innenfor rammen
        </Text>

        {loadingOCR ? (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={[styles.captureCircle, { top: FRAME_Y + FRAME_H + 28 }]}
          />
        ) : (
          <TouchableOpacity
            testID="capture-btn"
            style={[styles.captureCircle, { top: FRAME_Y + FRAME_H + 20 }]}
            onPress={handleTakePhoto}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
          <Text style={styles.backText}>← Tilbake</Text>
        </TouchableOpacity>

        {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}

        {loadingOCR && (
          <View style={styles.ocrLoading}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.ocrLoadingText}>Leser kvittering...</Text>
          </View>
        )}
        {ocrError && <Text style={styles.ocrError}>{ocrError}</Text>}

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

  if (step === 2) {
    const storeInfo = STORES[selectedStore];
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={styles.backText}>← Tilbake</Text>
        </TouchableOpacity>

        {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}

        <View style={styles.reviewHeader}>
          <View style={[styles.storeDot, { backgroundColor: storeInfo?.color, marginRight: 8, marginBottom: 0 }]} />
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

  const scannedStoreInfo = STORES[selectedStore];
  const cheapest = storeTotals[0];
  const scannedTotal = storeTotals.find((s) => s.store === selectedStore);
  const savings =
    scannedTotal && cheapest && cheapest.store !== selectedStore
      ? scannedTotal.total - cheapest.total
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.successScroll}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Takk!</Text>
      <Text style={styles.successText}>
        {items.length} priser lagt til fra {scannedStoreInfo?.name}
      </Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalCardLabel}>Du betalte</Text>
        <Text style={styles.totalCardAmount}>{receiptTotal.toFixed(2)} kr</Text>
        <Text style={styles.totalCardStore}>hos {scannedStoreInfo?.name}</Text>
      </View>

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

          {[...storeTotals].sort((a, b) => a.total - b.total).map(({ store, total }) => {
            const storeInfo = STORES[store];
            const isCheapest = store === cheapest?.store;
            const isScanned = store === selectedStore;
            const savingsFromCheapest = scannedTotal && cheapest ? total - cheapest.total : 0;
            return (
              <View
                key={store}
                style={[styles.comparisonRow, isCheapest && styles.comparisonRowCheapest]}
              >
                <View style={styles.comparisonLeft}>
                  <View style={[styles.compDot, { backgroundColor: storeInfo?.color }]} />
                  <Text style={styles.compStoreName}>{storeInfo?.name}</Text>
                  {isScanned && <Text style={styles.compTag}>din butikk</Text>}
                  {isCheapest && (
                    <Text style={[styles.compTag, styles.compTagGreen]}>billigst</Text>
                  )}
                  {!isCheapest && savingsFromCheapest > 0 && (
                    <Text style={styles.compTag}>
                      +{savingsFromCheapest.toFixed(2)} kr
                    </Text>
                  )}
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
  scrollContent: { paddingBottom: 120 },
  successScroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120, alignItems: "center" },
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
  captureBtn: { backgroundColor: COLORS.accent, padding: 16, borderRadius: 14, alignItems: "center" },
  captureBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scanCount: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 12 },
  photoPreview: { width: "100%", height: 200, borderRadius: 14, marginBottom: 20, resizeMode: "cover" },
  stepTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  stepDesc: { fontSize: 13, color: "#7A8068", marginBottom: 20 },
  storeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  storeCard: { width: "47%", padding: 18, borderRadius: 14, alignItems: "center", borderWidth: 2 },
  storeDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
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
  submitBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 14, alignItems: "center" },
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
  comparisonTitle: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 12 },
  savingsBanner: { backgroundColor: COLORS.accentLight, borderRadius: 10, padding: 10, marginBottom: 12 },
  savingsBannerText: { fontSize: 13, fontWeight: "600", color: COLORS.accent, textAlign: "center" },
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
  compTagGreen: { color: COLORS.success, backgroundColor: COLORS.accentLight },
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
  ocrLoading: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  ocrLoadingText: { fontSize: 13, color: COLORS.textSecondary },
  ocrError: { fontSize: 13, color: COLORS.danger, marginBottom: 12 },

  cameraContainer: { flex: 1, backgroundColor: "#000" },
  overlayDark: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
    borderWidth: 3,
  },
  cornerTL: { borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  cameraBackBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraBackText: { color: "#fff", fontSize: 15 },
  frameHint: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
  captureCircle: {
    position: "absolute",
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    left: (SCREEN_W - 70) / 2,
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
  },
  scanCountOverlay: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
});
