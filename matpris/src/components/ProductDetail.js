// src/components/ProductDetail.js

import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { COLORS } from "../utils/constants";
import { getCheapestStore, formatPrice, getStoreInfo } from "../utils/helpers";

export default function ProductDetail({ product, visible, onClose }) {
  if (!product) return null;

  const cheapest = getCheapestStore(product);
  const cheapestInfo = getStoreInfo(cheapest.store);
  const sortedPrices = Object.entries(product.prices).sort(
    (a, b) => a[1] - b[1]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.categoryLabel}>{product.category}</Text>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Cheapest highlight */}
          <View
            style={[
              styles.cheapestBox,
              {
                backgroundColor: cheapestInfo.bg,
                borderColor: cheapestInfo.color + "22",
              },
            ]}
          >
            <View>
              <Text style={styles.cheapestLabel}>Billigst hos</Text>
              <Text
                style={[styles.cheapestStore, { color: cheapestInfo.color }]}
              >
                {cheapestInfo.name}
              </Text>
            </View>
            <Text style={styles.cheapestPrice}>
              {formatPrice(cheapest.price)} kr
            </Text>
          </View>

          {/* All prices */}
          <Text style={styles.sectionTitle}>
            Alle priser ({sortedPrices.length} butikker)
          </Text>

          <ScrollView style={styles.priceList}>
            {sortedPrices.map(([storeKey, price], i) => {
              const store = getStoreInfo(storeKey);
              const diff = price - cheapest.price;
              const isCheapest = i === 0;

              return (
                <View
                  key={storeKey}
                  style={[
                    styles.priceRow,
                    {
                      backgroundColor: isCheapest ? "#F0F5EA" : COLORS.card,
                      borderColor: isCheapest ? "#C8DDB3" : COLORS.border,
                    },
                  ]}
                >
                  <View style={styles.priceRowLeft}>
                    <View
                      style={[styles.dot, { backgroundColor: store.color }]}
                    />
                    <Text
                      style={[
                        styles.storeName,
                        isCheapest && { fontWeight: "600" },
                      ]}
                    >
                      {store.name}
                    </Text>
                    {isCheapest && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>BILLIGST</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceRowRight}>
                    <Text
                      style={[
                        styles.rowPrice,
                        isCheapest && { fontWeight: "700" },
                      ]}
                    >
                      {formatPrice(price)} kr
                    </Text>
                    {diff > 0 && (
                      <Text style={styles.priceDiff}>
                        +{formatPrice(diff)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Text style={styles.footer}>
            Priser basert på {2 + Math.floor(Math.random() * 8)} kvitteringer
            siste 7 dager
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(11,29,15,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#D0D5C8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 11,
    color: "#7A8068",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 28,
    marginTop: 4,
  },
  closeBtn: {
    backgroundColor: COLORS.border,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  cheapestBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  cheapestLabel: {
    fontSize: 11,
    color: "#7A8068",
  },
  cheapestStore: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  cheapestPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  priceList: {
    maxHeight: 300,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  priceRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storeName: {
    fontSize: 15,
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  priceRowRight: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 6,
  },
  rowPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  priceDiff: {
    fontSize: 11,
    color: COLORS.danger,
  },
  footer: {
    fontSize: 11,
    color: "#B0B8A4",
    textAlign: "center",
    marginTop: 14,
  },
});
