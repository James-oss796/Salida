import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../../lib/supabase';

// The Web Client ID from Google Cloud Console
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function configureGoogleSignIn() {
  if (WEB_CLIENT_ID) {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false,
    });
  } else {
    console.warn('Google Web Client ID is not configured.');
  }
}

/**
 * Initiates the Google Sign-In flow and creates a Supabase session.
 * @returns {Promise<{ error: Error | null }>}
 */
export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    if (userInfo.data?.idToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });
      return { error };
    } else {
      throw new Error('No ID token present!');
    }
  } catch (error: any) {
    console.error('Google Sign-In failed', error);
    return { error };
  }
}

/**
 * Signs out of both Google and Supabase.
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Sign Out failed', error);
  }
}
