import { useState, useMemo, useEffect } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator,
} from "react-native";
import { COLORS } from "../utils/constants";
import { getFilteredProducts } from "../utils/helpers";
import { supabase } from "../utils/supabase";
import StoreFilter from "../components/StoreFilter";
import ProductCard from "../components/ProductCard";
import ProductDetail from "../components/ProductDetail";

export default function HomeScreen({ daysLeft, refreshKey }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, [refreshKey]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prices")
      .select("product_id, store, price, products(id, name, category)");

    console.log("=== HOMESCREEN FETCH ===");
    console.log("data:", JSON.stringify(data));
    console.log("error:", error?.message);
    console.log("========================");

    if (error) {
      console.error("Feil ved henting av produkter:", error.message);
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

    setProducts(Object.values(productMap));
    setLoading(false);
  };

  const filtered = useMemo(
    () => getFilteredProducts({ products, searchQuery, selectedStore, sortOrder: "low" }),
    [products, searchQuery, selectedStore]
  );

  const badgeStyle = daysLeft > 7
    ? { bg: "#EFF5E5", border: "#C8DDB3", text: "#4A7A1A" }
    : { bg: "#FEF3E3", border: "#F7C97E", text: "#C87D1A" };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>matpris</Text>
            <Text style={styles.subtitle}>
              {products.length} varer · 8 butikker · oppdatert i dag
            </Text>
          </View>
          <View style={[styles.accessBadge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
            <Text style={[styles.accessText, { color: badgeStyle.text }]}>{daysLeft}d igjen</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Søk etter matvare..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <StoreFilter selectedStore={selectedStore} onSelectStore={setSelectedStore} />

        {!loading && (
          <Text style={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? "vare" : "varer"} funnet
          </Text>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            selectedStore={selectedStore}
            onPress={() => setSelectedProduct(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.accent} />
            ) : (
              <>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>Ingen varer funnet</Text>
                <Text style={styles.emptyHint}>Prøv et annet søkeord eller fjern filtere</Text>
              </>
            )}
          </View>
        }
      />

      <ProductDetail
        product={selectedProduct}
        visible={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topSection: { paddingHorizontal: 20, paddingTop: 60 },
  list: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  accessBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  accessText: { fontSize: 11, fontWeight: "600" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.text },
  resultCount: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  emptyHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
});
