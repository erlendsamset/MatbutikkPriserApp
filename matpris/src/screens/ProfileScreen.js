/*
 * ProfileScreen.js — Brukerprofil og tilgangsstatus
 *
 * Viser statistikk for innlogget bruker: antall kvitteringer skannet og
 * hvor mange dager tilgangen er aktiv.
 *
 * Tilgangsmodellen: brukere må skanne minst én kvittering per måned for å
 * beholde tilgangen til appen. daysLeft og totalScans kommer som props fra App.js
 * og er foreløpig hardkodet der — de skal senere hentes fra "users"-tabellen i Supabase.
 */

import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS } from "../utils/constants";
import { supabase } from "../utils/supabase";

export default function ProfileScreen({ daysLeft, totalScans }) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(null);
  const accessOk = daysLeft > 7;
  const accessStyle = accessOk
    ? { bg: "#EFF5E5", border: "#C8DDB3" }
    : { bg: "#FEF3E3", border: "#F7C97E" };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSignOutError("Klarte ikke å logge ut. Prøv igjen.");
    }
    setSigningOut(false);
  };

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

      {signOutError && <Text style={styles.signOutError}>{signOutError}</Text>}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signingOut}>
        {signingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signOutBtnText}>Logg ut</Text>
        )}
      </TouchableOpacity>

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
  signOutError: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  signOutBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
