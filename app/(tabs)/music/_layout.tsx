/**
 * app/(tabs)/music/_layout.tsx — Layout for the Music tab
 *
 * Since the Music tab is a directory-based route (with index.tsx inside),
 * Expo Router requires a _layout.tsx to define how screens within this
 * directory are rendered. We use a simple Stack with no header.
 */
import { Stack } from 'expo-router';

export default function MusicLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
