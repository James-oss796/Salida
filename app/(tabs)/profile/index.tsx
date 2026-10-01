import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../../../src/features/auth/store';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useUploadChooser } from '../../../src/features/upload/UploadChooserSheet';
import { MyUploads } from '../../../src/features/profile/MyUploads';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { session, user } = useAuth();
  const { requireAuth } = useAuthStore();
  const { openChooser } = useUploadChooser();

  // Guest State
  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.guestTitle, { color: theme.onBackground }]}>Join Salida</Text>
        <Text style={[styles.guestText, { color: theme.onSurfaceMuted }]}>
          Sign in to upload videos, create playlists, and save your favourite content.
        </Text>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => requireAuth('upload')}
        >
          <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Sign In or Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Member State
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image 
            source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150' }} 
            style={[styles.avatar, { borderColor: theme.outline }]} 
          />
          <View style={styles.textInfo}>
            <Text style={[styles.displayName, { color: theme.onBackground }]}>
              {user?.user_metadata?.full_name || 'Dancer'}
            </Text>
            <Text style={[styles.username, { color: theme.onSurfaceMuted }]}>
              @{user?.email?.split('@')[0]}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.editButton, { borderColor: theme.outline }]}>
          <Text style={[styles.editButtonText, { color: theme.onBackground }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadSection}>
        <TouchableOpacity 
          style={[styles.uploadButton, { backgroundColor: theme.primary }]}
          onPress={openChooser}
        >
          <Text style={[styles.uploadButtonText, { color: theme.onPrimary }]}>+ Upload New Item</Text>
        </TouchableOpacity>
      </View>

      <MyUploads />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  guestText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  textInfo: {
    marginLeft: 16,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    marginTop: 4,
  },
  editButton: {
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '600',
  },
  uploadSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  uploadButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  myContentPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
