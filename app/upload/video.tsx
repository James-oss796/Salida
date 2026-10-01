import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'react-native-compressor';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTheme } from '../../src/theme/ThemeProvider';
import { uploadFileWithProgress } from '../../src/features/upload/upload';
import { supabase } from '../../src/lib/supabase';
import { APP_CONFIG } from '../../src/config/constants';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  caption: z.string().max(300, 'Caption too long').optional(),
});

type FormData = z.infer<typeof schema>;

export default function UploadVideoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Note: In MVP we trust the picker limits. For stricter limits, check asset.duration and asset.fileSize here.
      if (asset.duration && asset.duration > APP_CONFIG.MAX_VIDEO_DURATION_SEC * 1000) {
        Alert.alert('Video too long', 'Maximum duration is 3 minutes.');
        return;
      }
      setVideoUri(asset.uri);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!videoUri || !user) {
      Alert.alert('Error', 'Please select a video first.');
      return;
    }

    try {
      setIsCompressing(true);
      
      // 1. Generate Thumbnail
      const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000 });
      
      // 2. Compress Video (720p)
      const compressedUri = await Video.compress(videoUri, {
        compressionMethod: 'auto',
      }, (progress) => {
        // compression progress if needed
      });
      
      setIsCompressing(false);
      setIsUploading(true);

      const uuid = Math.random().toString(36).substring(2, 15);
      const videoPath = `${user.id}/${uuid}.mp4`;
      const thumbPath = `${user.id}/${uuid}.jpg`;

      // 3. Upload Thumbnail
      const thumbRes = await uploadFileWithProgress({
        bucket: 'thumbnails',
        path: thumbPath,
        fileUri: thumbUri,
        contentType: 'image/jpeg',
      });
      if (thumbRes.error) throw thumbRes.error;

      // 4. Upload Video
      const videoRes = await uploadFileWithProgress({
        bucket: 'videos',
        path: videoPath,
        fileUri: compressedUri,
        contentType: 'video/mp4',
        onProgress: (p) => setUploadProgress(p),
      });
      if (videoRes.error) throw videoRes.error;

      // 5. Insert to DB
      const { error: dbError } = await supabase.from('videos').insert({
        owner_id: user.id,
        title: data.title,
        caption: data.caption,
        video_path: videoPath,
        thumbnail_path: thumbPath,
      });

      if (dbError) throw dbError;

      // 6. Success
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      Alert.alert('Success', 'Video published!');
      router.back();

    } catch (error: any) {
      setIsCompressing(false);
      setIsUploading(false);
      Alert.alert('Upload Failed', error.message || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        {!videoUri ? (
          <TouchableOpacity style={[styles.pickerButton, { borderColor: theme.outline }]} onPress={pickVideo}>
            <Text style={[styles.pickerIcon, { color: theme.primary }]}>📹</Text>
            <Text style={[styles.pickerText, { color: theme.onBackground }]}>Select Video</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.previewContainer, { borderColor: theme.outline }]}>
            <Text style={{ color: theme.onSurfaceMuted }}>Video Selected</Text>
            <TouchableOpacity onPress={() => setVideoUri(null)} style={styles.changeButton}>
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
          name="caption"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.surfaceVariant, color: theme.onSurface }]}
              placeholder="Caption (optional)"
              placeholderTextColor={theme.onSurfaceMuted}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
            />
          )}
        />

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: (!videoUri || isCompressing || isUploading) ? 0.5 : 1 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={!videoUri || isCompressing || isUploading}
        >
          {isCompressing ? (
            <Text style={[styles.submitButtonText, { color: theme.onPrimary }]}>Compressing...</Text>
          ) : isUploading ? (
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
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { fontSize: 12, marginBottom: 12, marginTop: -8 },
  submitButton: {
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: { fontSize: 16, fontWeight: 'bold' },
});
