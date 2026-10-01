/**
 * SongsList.tsx — Scrollable list of music tracks
 *
 * Fetches tracks from Supabase via the `useSongsFeed` hook and renders
 * them in a FlatList. Tapping a track starts playback via the playerStore,
 * passing the full visible queue so the player can auto-advance.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useSongsFeed } from './hooks';
import { useTheme } from '../../theme/ThemeProvider';
import { TrackWithAuthor } from './api';
import { getPublicUrl } from '../../lib/storage';
import { usePlayerStore } from './playerStore';

export function SongsList() {
  const { data, fetchNextPage, hasNextPage, isLoading, isError, refetch } = useSongsFeed();
  const { theme } = useTheme();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);

  const tracks = data?.pages.flat() || [];

  const handleTrackPress = (track: TrackWithAuthor) => {
    // Play the selected track with the full list as the queue
    playTrack(track, tracks);
  };

  const renderItem = ({ item }: { item: TrackWithAuthor }) => {
    const coverUrl = getPublicUrl('thumbnails', item.cover_path);
    // Format duration from seconds to m:ss
    const mins = item.duration_seconds ? Math.floor(item.duration_seconds / 60) : 0;
    const secs = item.duration_seconds ? (item.duration_seconds % 60).toString().padStart(2, '0') : '00';
    const isActive = item.id === currentTrackId;

    return (
      <TouchableOpacity
        style={[styles.trackItem, isActive && { backgroundColor: theme.surfaceVariant }]}
        onPress={() => handleTrackPress(item)}
      >
        <Image
          source={coverUrl}
          style={[styles.cover, { backgroundColor: theme.surfaceVariant }]}
          contentFit="cover"
        />
        <View style={styles.trackInfo}>
          <Text
            style={[
              styles.title,
              { color: isActive ? theme.primary : theme.onBackground },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.artist, { color: theme.onSurfaceMuted }]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <Text style={[styles.duration, { color: theme.onSurfaceMuted }]}>
          {item.duration_seconds ? `${mins}:${secs}` : '--:--'}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={{ color: theme.onSurfaceMuted }}>⋯</Text>
        </TouchableOpacity>
      </TouchableOpacity>
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
        <Text style={{ color: theme.error }}>Failed to load songs</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onEndReached={() => {
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshing={isLoading}
      onRefresh={refetch}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 160, // Account for mini-player + tab bar
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
  },
  duration: {
    fontSize: 14,
    marginRight: 12,
  },
  moreButton: {
    padding: 8,
  },
});
