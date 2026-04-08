// src/screens/HomeScreen.js

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { COLORS, CATEGORIES } from "../utils/constants";
import { getFilteredProducts } from "../utils/helpers";
import StoreFilter from "../components/StoreFilter";
import ProductCard from "../components/ProductCard";
import ProductDetail from "../components/ProductDetail";

export default function HomeScreen({ daysLeft }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("low");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filtered = useMemo(
    () =>
      getFilteredProducts({
        searchQuery,
        selectedStore,
        selectedCategory,
        sortOrder,
      }),
    [searchQuery, selectedStore, selectedCategory, sortOrder]
  );

  const toggleSort = () => {
    setSortOrder((s) => (s === "low" ? "high" : "low"));
  };

  const ListHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>matpris</Text>
          <Text style={styles.subtitle}>
            15 varer · 8 butikker · oppdatert i dag
          </Text>
        </View>
        <View
          style={[
            styles.accessBadge,
            {
              backgroundColor: daysLeft > 7 ? "#EFF5E5" : "#FEF3E3",
              borderColor: daysLeft > 7 ? "#C8DDB3" : "#F7C97E",
            },
          ]}
        >
          <Text
            style={[
              styles.accessText,
              { color: daysLeft > 7 ? "#4A7A1A" : "#C87D1A" },
            ]}
          >
            {daysLeft}d igjen
          </Text>
        </View>
      </View>

      {/* Search */}
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

      {/* Store filter */}
      <StoreFilter
        selectedStore={selectedStore}
        onSelectStore={setSelectedStore}
      />

      {/* Category + Sort */}
      <View style={styles.filterRow}>
        <View style={styles.categoryPicker}>
          <TouchableOpacity
            style={styles.categoryBtn}
            onPress={() => {
              // Cycle through categories
              const all = ["all", ...CATEGORIES];
              const idx = all.indexOf(selectedCategory);
              setSelectedCategory(all[(idx + 1) % all.length]);
            }}
          >
            <Text style={styles.categoryText}>
              {selectedCategory === "all"
                ? "Alle kategorier"
                : selectedCategory}
            </Text>
            <Text style={styles.categoryArrow}> ▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.sortBtn} onPress={toggleSort}>
          <Text style={styles.sortText}>
            {sortOrder === "low" ? "↑ Billigst" : "↓ Dyrest"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result count */}
      <Text style={styles.resultCount}>
        {filtered.length} {filtered.length === 1 ? "vare" : "varer"} funnet
      </Text>
    </View>
  );

  const EmptyList = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyText}>Ingen varer funnet</Text>
      <Text style={styles.emptyHint}>
        Prøv et annet søkeord eller fjern filtere
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            selectedStore={selectedStore}
            onPress={() => setSelectedProduct(item)}
          />
        )}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  list: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  accessBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  accessText: {
    fontSize: 11,
    fontWeight: "600",
  },
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
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  categoryPicker: {
    flex: 1,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.text,
  },
  categoryArrow: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  sortBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortText: {
    fontSize: 13,
    color: COLORS.text,
  },
  resultCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
