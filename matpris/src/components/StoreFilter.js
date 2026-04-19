// src/components/StoreFilter.js

import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { STORES, COLORS } from "../utils/constants";

export default function StoreFilter({ selectedStore, onSelectStore }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor:
              selectedStore === "all" ? COLORS.accent : COLORS.border,
          },
        ]}
        onPress={() => onSelectStore("all")}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: selectedStore === "all" ? "#fff" : COLORS.textSecondary,
            },
          ]}
        >
          Alle butikker
        </Text>
      </TouchableOpacity>

      {Object.entries(STORES).map(([key, store]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.chip,
            {
              backgroundColor:
                selectedStore === key ? store.color : store.bg,
            },
          ]}
          onPress={() => onSelectStore(key)}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: selectedStore === key ? "#fff" : store.color,
              },
            ]}
          >
            {store.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  content: {
    gap: 6,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
