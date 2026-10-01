import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../src/theme/ThemeProvider';
import { uploadFileWithProgress } from '../../src/features/upload/upload';
import { supabase } from '../../src/lib/supabase';
import { APP_CONFIG } from '../../src/config/constants';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  artist: z.string().min(1, 'Artist is required').max(100, 'Artist too long'),
  album: z.string().max(100, 'Album too long').optional(),
});

type FormData = z.infer<typeof schema>;

export default function UploadMusicScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.size && asset.size > APP_CONFIG.MAX_AUDIO_SIZE_BYTES) {
        Alert.alert('File too large', 'Maximum size is 20 MB.');
        return;
      }
      setAudioUri(asset.uri);
      setAudioName(asset.name);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!audioUri || !user) {
      Alert.alert('Error', 'Please select an audio file first.');
      return;
    }

    try {
      setIsUploading(true);

      const uuid = Math.random().toString(36).substring(2, 15);
      // Determine extension from original name if possible
      const ext = audioName?.split('.').pop() || 'mp3';
      const audioPath = `${user.id}/${uuid}.${ext}`;

      // 1. Upload Audio
      const audioRes = await uploadFileWithProgress({
        bucket: 'music',
        path: audioPath,
        fileUri: audioUri,
        contentType: `audio/${ext === 'm4a' ? 'x-m4a' : ext}`,
        onProgress: (p) => setUploadProgress(p),
      });
      if (audioRes.error) throw audioRes.error;

      // 2. Insert to DB
      const { error: dbError } = await supabase.from('tracks').insert({
        owner_id: user.id,
        title: data.title,
        artist: data.artist,
        album: data.album || null,
        audio_path: audioPath,
      });

      if (dbError) throw dbError;

      // 3. Success
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      Alert.alert('Success', 'Track published!');
      router.back();

    } catch (error: any) {
      setIsUploading(false);
      Alert.alert('Upload Failed', error.message || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        {!audioUri ? (
          <TouchableOpacity style={[styles.pickerButton, { borderColor: theme.outline }]} onPress={pickAudio}>
            <Text style={[styles.pickerIcon, { color: theme.primary }]}>🎵</Text>
            <Text style={[styles.pickerText, { color: theme.onBackground }]}>Select Audio File</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.previewContainer, { borderColor: theme.outline }]}>
            <Text style={{ color: theme.onSurface, fontWeight: 'bold' }}>{audioName}</Text>
            <TouchableOpacity onPress={() => setAudioUri(null)} style={styles.changeButton}>
              <Text style={{ color: theme.primary }}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.onSurface }]}
              placeholder="Title"
              placeholderTextColor={theme.onSurfaceMuted}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.title && <Text style={[styles.errorText, { color: theme.error }]}>{errors.title.message}</Text>}

        <Controller
          control={control}
          name="artist"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.onSurface }]}
              placeholder="Artist"
              placeholderTextColor={theme.onSurfaceMuted}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.artist && <Text style={[styles.errorText, { color: theme.error }]}>{errors.artist.message}</Text>}

        <Controller
          control={control}
          name="album"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.onSurface }]}
              placeholder="Album (optional)"
              placeholderTextColor={theme.onSurfaceMuted}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.album && <Text style={[styles.errorText, { color: theme.error }]}>{errors.album.message}</Text>}

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: (!audioUri || isUploading) ? 0.5 : 1 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={!audioUri || isUploading}
        >
          {isUploading ? (
            <Text style={[styles.submitButtonText, { color: theme.onPrimary }]}>Uploading {Math.round(uploadProgress * 100)}%</Text>
          ) : (
            <Text style={[styles.submitButtonText, { color: theme.onPrimary }]}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  pickerButton: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pickerIcon: { fontSize: 40, marginBottom: 8 },
  pickerText: { fontSize: 16, fontWeight: '600' },
  previewContainer: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  changeButton: { marginTop: 8 },
  input: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  errorText: { fontSize: 12, marginBottom: 12, marginTop: -8 },
  submitButton: {
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: { fontSize: 16, fontWeight: 'bold' },
});
