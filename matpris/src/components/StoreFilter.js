import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { STORES, COLORS } from "../utils/constants";

const CHIPS = [
  { key: "all", name: "Alle butikker", color: COLORS.accent, bg: COLORS.border },
  ...Object.entries(STORES).map(([key, s]) => ({ key, ...s })),
];

export default function StoreFilter({ selectedStore, onSelectStore }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {CHIPS.map(({ key, name, color, bg }) => {
        const active = selectedStore === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, { backgroundColor: active ? color : bg }]}
            onPress={() => onSelectStore(key)}
          >
            <Text style={[styles.chipText, { color: active ? "#fff" : color }]}>
              {name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  content: { gap: 6, paddingRight: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  chipText: { fontSize: 12, fontWeight: "600" },
});
