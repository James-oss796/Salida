import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useAuthStore } from './store';
import { useTheme } from '../../theme/ThemeProvider';
import { signInWithGoogle } from './google';
import { supabase } from '../../lib/supabase';

export function SignInSheet() {
  const { theme } = useTheme();
  const { isSignInSheetVisible, pendingActionReason, closeSignInSheet, executePendingAction } = useAuthStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const [mode, setMode] = useState<'initial' | 'email'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignInSheetVisible) {
      bottomSheetRef.current?.expand();
      setMode('initial');
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isSignInSheetVisible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1 && isSignInSheetVisible) {
      closeSignInSheet();
    }
  }, [isSignInSheetVisible, closeSignInSheet]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const getTitle = () => {
    switch (pendingActionReason) {
      case 'upload': return 'Sign in to upload';
      case 'like': return 'Sign in to like this';
      case 'playlist': return 'Sign in to create a playlist';
      case 'report': return 'Sign in to report';
      case 'edit': return 'Sign in to edit your profile';
      case 'browse-limit': return 'Enjoying Salida? Sign in to save your favourites';
      default: return 'Join Salida';
    }
  };

  const onGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
    } else {
      executePendingAction(); // Close sheet and run the action
    }
  };

  const onEmailSubmit = async () => {
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Sign in failed', error.message);
      else executePendingAction();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert('Sign up failed', error.message);
      else {
        Alert.alert('Success', 'Check your email for the confirmation link.');
        setMode('initial');
      }
    }
    setLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: theme.surface,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.onSurface,
      marginBottom: 32,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 999,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: theme.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    secondaryButton: {
      backgroundColor: theme.surfaceVariant,
      padding: 16,
      borderRadius: 999,
      alignItems: 'center',
      marginBottom: 16,
    },
    secondaryButtonText: {
      color: theme.onSurface,
      fontSize: 16,
      fontWeight: '600',
    },
    textButton: {
      padding: 16,
      alignItems: 'center',
    },
    textButtonText: {
      color: theme.onSurfaceMuted,
      fontSize: 14,
    },
    input: {
      backgroundColor: theme.surfaceVariant,
      color: theme.onSurface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      fontSize: 16,
    },
  });

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.onSurfaceMuted }}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>{getTitle()}</Text>

        {mode === 'initial' ? (
          <>
            <TouchableOpacity style={styles.button} onPress={onGoogleSignIn} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.buttonText}>Continue with Google</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('email')}>
              <Text style={styles.secondaryButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textButton} onPress={closeSignInSheet}>
              <Text style={styles.textButtonText}>Not now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.onSurfaceMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.onSurfaceMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={onEmailSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.textButton} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.textButtonText}>
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={() => setMode('initial')}>
              <Text style={styles.textButtonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
