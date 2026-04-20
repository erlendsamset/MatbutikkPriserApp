import { useState, useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from "react-native";
import { supabase } from "../utils/supabase";
import { COLORS, STORES } from "../utils/constants";

export default function TilbudScreen() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDeals(); }, []);

  const fetchDeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prices")
      .select("product_id, store, price, products(id, name, category)");

    if (error) {
      console.error("Feil ved henting av tilbud:", error.message);
      setLoading(false);
      return;
    }

    const productMap = {};
    for (const row of data) {
      const p = row.products;
      if (!p) continue;
      if (!productMap[p.id]) {
        productMap[p.id] = { id: p.id, name: p.name, category: p.category, prices: {} };
      }
      productMap[p.id].prices[row.store] = parseFloat(row.price);
    }

    const withSavings = Object.values(productMap).map((product) => {
      const priceValues = Object.values(product.prices);
      const minPrice = Math.min(...priceValues);
      const maxPrice = Math.max(...priceValues);
      const saving = maxPrice - minPrice;
      const cheapestStore = Object.keys(product.prices).find((k) => product.prices[k] === minPrice);
      return { ...product, minPrice, maxPrice, saving, cheapestStore };
    });

    withSavings.sort((a, b) => b.saving - a.saving);
    setDeals(withSavings.slice(0, 20));
    setLoading(false);
  };

  const renderItem = ({ item, index }) => {
    const store = STORES[item.cheapestStore];
    return (
      <View style={styles.card}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.priceRow}>
            <View style={[styles.storeBadge, { backgroundColor: store?.bg }]}>
              <View style={[styles.storeDot, { backgroundColor: store?.color }]} />
              <Text style={[styles.storeName, { color: store?.color }]}>{store?.name}</Text>
            </View>
            <Text style={styles.minPrice}>{item.minPrice.toFixed(2)} kr</Text>
          </View>
        </View>
        <View style={styles.savingBadge}>
          <Text style={styles.savingLabel}>spar</Text>
          <Text style={styles.savingAmount}>{item.saving.toFixed(0)} kr</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.title}>Beste tilbud</Text>
        <Text style={styles.subtitle}>Størst prisforskjell mellom butikkene akkurat nå</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topSection: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  rankBadge: { width: 32, alignItems: "center" },
  rankText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  cardContent: { flex: 1, gap: 4 },
  productName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  category: { fontSize: 11, color: COLORS.textMuted },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  storeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  storeDot: { width: 6, height: 6, borderRadius: 3 },
  storeName: { fontSize: 11, fontWeight: "600" },
  minPrice: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  savingBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  savingLabel: { fontSize: 9, color: COLORS.success, fontWeight: "500" },
  savingAmount: { fontSize: 15, fontWeight: "700", color: COLORS.accent },
});
