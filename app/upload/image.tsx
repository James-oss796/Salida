import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../../src/theme/ThemeProvider';
import { uploadFileWithProgress } from '../../src/features/upload/upload';
import { supabase } from '../../src/lib/supabase';
import { APP_CONFIG } from '../../src/config/constants';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  caption: z.string().max(300, 'Caption too long').optional(),
});

type FormData = z.infer<typeof schema>;

export default function UploadImageScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Let user upload full photo, not squared
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > APP_CONFIG.MAX_IMAGE_SIZE_BYTES) {
        Alert.alert('Image too large', 'Maximum size is 10 MB.');
        return;
      }
      setImageUri(asset.uri);
      setImageWidth(asset.width);
      setImageHeight(asset.height);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!imageUri || !user) {
      Alert.alert('Error', 'Please select an image first.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 1. Generate Thumbnail
      const thumbResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 400 } }], // Resize down to max 400px width
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      setIsProcessing(false);
      setIsUploading(true);

      const uuid = Math.random().toString(36).substring(2, 15);
      const imagePath = `${user.id}/${uuid}.jpg`;
      const thumbPath = `${user.id}/${uuid}.jpg`;

      // 2. Upload Thumbnail
      const thumbRes = await uploadFileWithProgress({
        bucket: 'thumbnails',
        path: thumbPath,
        fileUri: thumbResult.uri,
        contentType: 'image/jpeg',
      });
      if (thumbRes.error) throw thumbRes.error;

      // 3. Upload Full Image
      const imageRes = await uploadFileWithProgress({
        bucket: 'images',
        path: imagePath,
        fileUri: imageUri,
        contentType: 'image/jpeg',
        onProgress: (p) => setUploadProgress(p),
      });
      if (imageRes.error) throw imageRes.error;

      // 4. Insert to DB
      const { error: dbError } = await supabase.from('images').insert({
        owner_id: user.id,
        caption: data.caption,
        image_path: imagePath,
        thumbnail_path: thumbPath,
        width: imageWidth,
        height: imageHeight,
      });

      if (dbError) throw dbError;

      // 5. Success
      queryClient.invalidateQueries({ queryKey: ['images'] });
      Alert.alert('Success', 'Image published!');
      router.back();

    } catch (error: any) {
      setIsProcessing(false);
      setIsUploading(false);
      Alert.alert('Upload Failed', error.message || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        {!imageUri ? (
          <TouchableOpacity style={[styles.pickerButton, { borderColor: theme.outline }]} onPress={pickImage}>
            <Text style={[styles.pickerIcon, { color: theme.primary }]}>🖼️</Text>
            <Text style={[styles.pickerText, { color: theme.onBackground }]}>Select Image</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.changeButton}>
              <Text style={{ color: theme.primary }}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

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
        {errors.caption && <Text style={[styles.errorText, { color: theme.error }]}>{errors.caption.message}</Text>}

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: (!imageUri || isProcessing || isUploading) ? 0.5 : 1 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={!imageUri || isProcessing || isUploading}
        >
          {isProcessing ? (
            <Text style={[styles.submitButtonText, { color: theme.onPrimary }]}>Processing...</Text>
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
  previewWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
