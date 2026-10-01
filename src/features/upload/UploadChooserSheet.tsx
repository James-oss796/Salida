import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { create } from 'zustand';

interface UploadChooserState {
  isVisible: boolean;
  openChooser: () => void;
  closeChooser: () => void;
}

export const useUploadChooser = create<UploadChooserState>((set) => ({
  isVisible: false,
  openChooser: () => set({ isVisible: true }),
  closeChooser: () => set({ isVisible: false }),
}));

export function UploadChooserSheet() {
  const { theme } = useTheme();
  const { isVisible, closeChooser } = useUploadChooser();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);
  const router = useRouter();

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1 && isVisible) {
      closeChooser();
    }
  }, [isVisible, closeChooser]);

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

  const handleSelect = (type: 'video' | 'music' | 'image') => {
    closeChooser();
    // Use setTimeout to ensure sheet closes before navigating, preventing animation jank
    setTimeout(() => {
      router.push(`/upload/${type}`);
    }, 300);
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
      marginBottom: 24,
      textAlign: 'center',
    },
    optionButton: {
      backgroundColor: theme.surfaceVariant,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      fontSize: 24,
      marginRight: 16,
    },
    optionText: {
      color: theme.onSurface,
      fontSize: 18,
      fontWeight: '600',
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
        <Text style={styles.title}>What do you want to upload?</Text>

        <TouchableOpacity style={styles.optionButton} onPress={() => handleSelect('video')}>
          <Text style={styles.optionIcon}>🎥</Text>
          <Text style={styles.optionText}>Dance Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => handleSelect('music')}>
          <Text style={styles.optionIcon}>🎵</Text>
          <Text style={styles.optionText}>Music Track</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => handleSelect('image')}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={styles.optionText}>Image Gallery</Text>
        </TouchableOpacity>

      </BottomSheetView>
    </BottomSheet>
  );
}
