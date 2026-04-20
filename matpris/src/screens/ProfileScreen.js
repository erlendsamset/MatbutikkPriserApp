import { View, Text, ScrollView, StyleSheet } from "react-native";
import { STORES, COLORS } from "../utils/constants";

const SCAN_HISTORY = [
  { store: "rema", date: "5. april 2026",  items: 8  },
  { store: "kiwi", date: "28. mars 2026",  items: 12 },
  { store: "meny", date: "15. mars 2026",  items: 5  },
];

export default function ProfileScreen({ daysLeft, totalScans }) {
  const accessOk = daysLeft > 7;
  const accessStyle = accessOk
    ? { bg: "#EFF5E5", border: "#C8DDB3" }
    : { bg: "#FEF3E3", border: "#F7C97E" };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Min profil</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Bruker</Text>
            <Text style={styles.profileSince}>Medlem siden mars 2026</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalScans}</Text>
            <Text style={styles.statLabel}>Kvitteringer</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{daysLeft}</Text>
            <Text style={styles.statLabel}>Dager igjen</Text>
          </View>
        </View>
      </View>

      <View style={[styles.accessBox, { backgroundColor: accessStyle.bg, borderColor: accessStyle.border }]}>
        <Text style={styles.accessIcon}>{accessOk ? "✅" : "⚠️"}</Text>
        <View style={styles.accessText}>
          <Text style={styles.accessTitle}>
            {accessOk ? "Tilgang aktiv" : "Tilgangen utløper snart!"}
          </Text>
          <Text style={styles.accessDesc}>
            {accessOk
              ? `${daysLeft} dager igjen — skann en kvittering for å fornye`
              : `Kun ${daysLeft} dager igjen — skann nå!`}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Siste skanninger</Text>
      {SCAN_HISTORY.map((scan, i) => {
        const store = STORES[scan.store];
        return (
          <View key={i} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <View style={[styles.historyDot, { backgroundColor: store?.color }]} />
              <View>
                <Text style={styles.historyStore}>{store?.name}</Text>
                <Text style={styles.historyDate}>{scan.date}</Text>
              </View>
            </View>
            <Text style={styles.historyCount}>{scan.items} varer</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.text, marginBottom: 24 },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: COLORS.accent,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22 },
  profileName: { fontSize: 17, fontWeight: "600", color: "#fff" },
  profileSince: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  accessBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  accessIcon: { fontSize: 18 },
  accessText: { flex: 1 },
  accessTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  accessDesc: { fontSize: 12, color: "#7A8068", marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyStore: { fontSize: 14, fontWeight: "500", color: COLORS.text },
  historyDate: { fontSize: 11, color: COLORS.textMuted },
  historyCount: { fontSize: 12, color: "#7A8068" },
});
