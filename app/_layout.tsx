/**
 * app/_layout.tsx — Root Layout
 *
 * This is the top-level layout for the entire app. It wraps all screens in:
 *   1. QueryClientProvider (React Query for data fetching)
 *   2. ThemeProvider (dynamic color themes)
 *   3. AuthProvider (Supabase auth session tracking)
 *   4. GestureHandlerRootView (required by bottom sheets & gestures)
 *
 * It also renders global overlays that need to be accessible from any screen:
 *   - MiniPlayer: persistent audio player bar above the tab bar
 *   - SignInSheet: auth bottom sheet triggered by requireAuth()
 *   - UploadChooserSheet: content type picker for uploads
 *
 * The Stack navigator defines all root-level routes:
 *   - index: redirects to (tabs)
 *   - (tabs): the main tab navigator
 *   - upload/*: modal screens for uploading content
 *   - now-playing: full-screen music player modal
 */
import { Stack } from "expo-router";
import { AuthProvider } from "../src/features/auth/AuthProvider";
import { SignInSheet } from "../src/features/auth/SignInSheet";
import { UploadChooserSheet } from "../src/features/upload/UploadChooserSheet";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { MiniPlayer } from '../src/features/music/MiniPlayer';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { configureGoogleSignIn } from "../src/features/auth/google";
import { setupTrackPlayer } from '../src/features/music/playerService';
import { usePlayerProgress } from '../src/features/music/usePlayerProgress';

const queryClient = new QueryClient();

/**
 * Inner layout component that has access to the theme context.
 * Renders the Stack navigator and all global overlays.
 */
function RootLayoutNav() {
  const { theme } = useTheme();

  // Mount the player progress bridge so TrackPlayer state syncs to Zustand
  usePlayerProgress();

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
        }}
      >
        {/* Root index — redirects to (tabs) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Main tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Upload modals */}
        <Stack.Screen
          name="upload/video"
          options={{ title: "Upload Video", presentation: "modal" }}
        />
        <Stack.Screen
          name="upload/music"
          options={{ title: "Upload Music", presentation: "modal" }}
        />
        <Stack.Screen
          name="upload/image"
          options={{ title: "Upload Image", presentation: "modal" }}
        />
        {/* Now Playing — full-screen modal */}
        <Stack.Screen
          name="now-playing"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      {/* Global overlays rendered above the Stack */}
      <MiniPlayer />
      <SignInSheet />
      <UploadChooserSheet />
    </GestureHandlerRootView>
  );
}

/**
 * Root layout that wraps the entire app in providers.
 * Also handles one-time initialization (Google Sign-In, TrackPlayer).
 */
export default function RootLayout() {
  useEffect(() => {
    // Initialize Google Sign-In configuration
    configureGoogleSignIn();
    // Initialize the audio player engine
    setupTrackPlayer();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
