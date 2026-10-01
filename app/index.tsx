/**
 * app/index.tsx — Root index route
 *
 * Expo Router requires an index route at the root. Without this file,
 * the app shows the default Expo welcome screen instead of our tabs.
 * This simply redirects immediately to the (tabs) group.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/videos" />;
}
