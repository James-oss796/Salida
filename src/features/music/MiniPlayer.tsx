/**
 * MiniPlayer.tsx — Persistent Mini Player Bar
 *
 * A compact player bar that sits above the tab bar whenever a track is
 * playing or paused. It shows:
 *   - A thin progress bar at the very top
 *   - Cover art thumbnail (40×40)
 *   - Track title & artist
 *   - Play/Pause button
 *
 * Tapping anywhere on the bar (except the play/pause button) opens the
 * full Now Playing modal screen.
 *
 * The bar animates in from the bottom when a track starts and slides
 * out when the player is stopped/cleared.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { usePlayerStore } from './playerStore';
import { useTheme } from '../../theme/ThemeProvider';
import { getPublicUrl } from '../../lib/storage';

export function MiniPlayer() {
  const { theme } = useTheme();
  const router = useRouter();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);

  // Slide-in/out animation
  const translateY = useRef(new Animated.Value(100)).current; // Start off-screen below

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: currentTrack ? 0 : 100, // 0 = visible, 100 = hidden below
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [currentTrack, translateY]);

  // Don't render anything at all if there's never been a track
  if (!currentTrack) return null;

  const coverUrl = getPublicUrl('thumbnails', currentTrack.cover_path);
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const openNowPlaying = () => {
    router.push('/now-playing');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.outline,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Progress bar — thin line at the top */}
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceVariant }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>

      <Pressable style={styles.content} onPress={openNowPlaying}>
        {/* Cover art */}
        <Image
          source={coverUrl}
          style={[styles.coverArt, { backgroundColor: theme.surfaceVariant }]}
          contentFit="cover"
        />

        {/* Title & Artist */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.onSurface }]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.artist, { color: theme.onSurfaceMuted }]} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Play/Pause */}
        <TouchableOpacity
          style={[styles.playPauseButton, { backgroundColor: theme.primary }]}
          onPress={(e) => {
            e.stopPropagation(); // Don't trigger the Pressable underneath
            togglePlayPause();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.playPauseIcon, { color: theme.onPrimary }]}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80, // Sit just above the tab bar (approximate tab bar height)
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coverArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    fontSize: 16,
  },
});
