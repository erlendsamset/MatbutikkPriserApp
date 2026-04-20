// src/screens/LoginScreen.js

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS } from "../utils/constants";
import { supabase } from "../utils/supabase";

export default function LoginScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setInfo("Sjekk e-posten din for å bekrefte kontoen.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Matpris</Text>
        <Text style={styles.tagline}>
          Sammenlign priser. Spar penger. Skann kvitteringer.
        </Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === "login" && styles.tabActive]}
            onPress={() => { setMode("login"); setError(null); setInfo(null); }}
          >
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
              Logg inn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "register" && styles.tabActive]}
            onPress={() => { setMode("register"); setError(null); setInfo(null); }}
          >
            <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
              Registrer
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="E-post"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Passord"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {info && <Text style={styles.infoText}>{info}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "login" ? "Logg inn" : "Opprett konto"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.card,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
  infoText: {
    color: COLORS.success,
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
