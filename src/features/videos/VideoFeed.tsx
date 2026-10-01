import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Dimensions, ActivityIndicator, ViewToken, StyleSheet } from 'react-native';
import { useVideosFeed } from './hooks';
import { VideoItem } from './VideoItem';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../auth/store';

const { height: windowHeight } = Dimensions.get('window');

export function VideoFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useVideosFeed();
  const { theme } = useTheme();
  const { incrementVideoView } = useAuthStore();
  
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videos = data?.pages.flat() || [];

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const activeItem = viewableItems[0].item;
      setActiveVideoId(activeItem.id);
      
      // Clear previous timer
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
      
      // Start 2s timer for view increment
      viewTimerRef.current = setTimeout(() => {
        incrementVideoView();
      }, 2000);
    }
  }, [incrementVideoView]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Requires 80% visibility to trigger
  }).current;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, []);

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
        <Text style={{ color: theme.error }}>Failed to load videos</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.onSurfaceMuted }}>No videos yet, be the first to upload</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <VideoItem 
          video={item} 
          isActive={item.id === activeVideoId} 
        />
      )}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={() => {
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshing={isLoading}
      onRefresh={refetch}
      snapToAlignment="start"
      decelerationRate="fast"
      getItemLayout={(data, index) => ({
        length: windowHeight,
        offset: windowHeight * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
