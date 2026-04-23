/*
 * ProductCard.js — Produktkort i listen
 *
 * Viser ett produkt som et trykkbart kort i søkelisten.
 * Innhold: produktnavn, kategori, billigste butikk og pris.
 *
 * Hvis brukeren har valgt en spesifikk butikk i filteret, vises
 * den butikkens pris i stedet for billigste pris på tvers av alle butikker.
 * Trykk på kortet åpner ProductDetail-modalen.
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";
import { getCheapestStore, formatPrice, getStoreInfo } from "../utils/helpers";

export default function ProductCard({ product, selectedStore, onPress }) {
  const cheapest = getCheapestStore(product);
  const cheapestInfo = getStoreInfo(cheapest.store);
  const displayPrice =
    selectedStore !== "all"
      ? product.prices[selectedStore]
      : cheapest.price;
  const storeCount = Object.keys(product.prices).length;
  const maxPrice = Math.max(...Object.values(product.prices));

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.storeRow}>
            <View
              style={[styles.dot, { backgroundColor: cheapestInfo.color }]}
            />
            <Text style={styles.storeText}>
              {selectedStore === "all"
                ? `Billigst: ${cheapestInfo.name}`
                : getStoreInfo(selectedStore).name}{" "}
              · {storeCount} butikker
            </Text>
          </View>
        </View>

        <View style={styles.priceCol}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(displayPrice)}</Text>
            <Text style={styles.kr}> kr</Text>
          </View>
          {selectedStore === "all" && storeCount > 1 && (
            <Text style={styles.maxPrice}>
              Dyreste: {formatPrice(maxPrice)} kr
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  category: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 2,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  storeText: {
    fontSize: 11,
    color: "#7A8068",
  },
  priceCol: {
    alignItems: "flex-end",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  kr: {
    fontSize: 13,
    color: "#7A8068",
  },
  maxPrice: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 2,
  },
});
