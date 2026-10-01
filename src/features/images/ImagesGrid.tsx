import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useImagesFeed } from './hooks';
import { useTheme } from '../../theme/ThemeProvider';
import { ImageWithAuthor } from './api';
import { getPublicUrl } from '../../lib/storage';
import { ImageViewer } from './ImageViewer';

export function ImagesGrid() {
  const { data, fetchNextPage, hasNextPage, isLoading, isError, refetch } = useImagesFeed();
  const { theme } = useTheme();

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const images = data?.pages.flat() || [];

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const renderItem = ({ item, index }: { item: ImageWithAuthor; index: number }) => {
    const thumbnailUrl = getPublicUrl('thumbnails', item.thumbnail_path || item.image_path);
    // Calculate aspect ratio to avoid layout jumps if we have width/height stored
    const aspectRatio = item.width && item.height ? item.width / item.height : 1;

    return (
      <Pressable onPress={() => handleImagePress(index)} style={styles.itemContainer}>
        <Image
          source={thumbnailUrl}
          style={[styles.image, { aspectRatio }]}
          contentFit="cover"
          transition={200}
        />
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.error }}>Failed to load images</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: theme.background }]}>
      <FlashList
        data={images}
        numColumns={2}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 4 }}
      />
      
      {selectedImageIndex !== null && (
        <ImageViewer 
          images={images} 
          initialIndex={selectedImageIndex} 
          onClose={() => setSelectedImageIndex(null)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    padding: 2,
  },
  image: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333', // Placeholder color
  },
});
