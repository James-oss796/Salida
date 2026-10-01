import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or Anon Key is missing from the environment variables.",
  );
}

/**
 * Secure storage for Android and iOS.
 */
const nativeStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },

  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },

  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Browser storage for Expo Web.
 */
const webStorage = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

/**
 * Use SecureStore on native platforms and localStorage on web.
 */
const storage = Platform.OS === "web" ? webStorage : nativeStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,

    // Web needs URL detection for OAuth callbacks.
    // Native does not.
    detectSessionInUrl: Platform.OS === "web",
  },
});
