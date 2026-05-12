/*
 * supabase.js — Supabase-klient
 *
 * Oppretter og eksporterer én delt Supabase-klient som brukes i hele appen
 * for database-spørringer og autentisering.
 *
 * Konfigurasjon:
 *   - URL og API-nøkkel hentes fra miljøvariabler (EXPO_PUBLIC_*)
 *   - Innloggingsøkten lagres kryptert på enheten via expo-secure-store,
 *     slik at brukeren forblir innlogget mellom app-starter
 *   - autoRefreshToken: Supabase fornyer JWT-tokenet automatisk før det utløper
 */

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
