/**
 * app/now-playing.tsx — Full-Screen Now Playing Modal
 *
 * A polished, full-screen modal that shows when the user taps the MiniPlayer.
 * Displays:
 *   - Large cover art (takes ~45% of the screen)
 *   - Track title, artist name
 *   - Seek bar with current time / total time
 *   - Transport controls: previous, play/pause, next
 *   - Repeat and shuffle toggle buttons
 *   - A pull-down handle and close button to dismiss
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { usePlayerStore } from '../src/features/music/playerStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { getPublicUrl } from '../src/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH * 0.75; // 75% of screen width

/**
 * Format seconds into m:ss display string.
 * Example: 125 → "2:05"
 */
function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function NowPlayingScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  // If no track, show nothing (shouldn't normally happen)
  if (!currentTrack) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.onSurfaceMuted, textAlign: 'center', marginTop: 100 }}>
          No track selected
        </Text>
      </SafeAreaView>
    );
  }

  const coverUrl = getPublicUrl('thumbnails', currentTrack.cover_path);

  // Visual indicators for repeat mode
  const repeatLabel =
    repeatMode === 'one' ? '🔂' : repeatMode === 'all' ? '🔁' : '🔁';
  const repeatOpacity = repeatMode === 'off' ? 0.4 : 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top bar: pull handle + close */}
      <View style={styles.topBar}>
        <View style={[styles.pullHandle, { backgroundColor: theme.onSurfaceMuted }]} />
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={[styles.closeIcon, { color: theme.onSurface }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Cover Art */}
      <View style={styles.artworkContainer}>
        <Image
          source={coverUrl}
          style={[
            styles.artwork,
            {
              backgroundColor: theme.surfaceVariant,
              shadowColor: theme.primary,
            },
          ]}
          contentFit="cover"
        />
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: theme.onBackground }]} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={[styles.trackArtist, { color: theme.onSurfaceMuted }]} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Seek Bar */}
      <View style={styles.seekSection}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          onSlidingComplete={(value) => seekTo(value)}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={theme.surfaceVariant}
          thumbTintColor={theme.primary}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: theme.onSurfaceMuted }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: theme.onSurfaceMuted }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Transport Controls */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <TouchableOpacity onPress={toggleShuffle} style={styles.secondaryControl}>
          <Text style={[styles.controlIcon, { color: theme.onSurface, opacity: isShuffled ? 1 : 0.4 }]}>
            🔀
          </Text>
        </TouchableOpacity>

        {/* Previous */}
        <TouchableOpacity onPress={playPrevious} style={styles.transportButton}>
          <Text style={[styles.transportIcon, { color: theme.onSurface }]}>⏮</Text>
        </TouchableOpacity>

        {/* Play / Pause (large, primary-colored) */}
        <TouchableOpacity
          onPress={togglePlayPause}
          style={[styles.playPauseButton, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.playPauseIcon, { color: theme.onPrimary }]}>
            {isPlaying ? '⏸' : '▶️'}
          </Text>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={playNext} style={styles.transportButton}>
          <Text style={[styles.transportIcon, { color: theme.onSurface }]}>⏭</Text>
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity onPress={toggleRepeat} style={styles.secondaryControl}>
          <Text style={[styles.controlIcon, { color: theme.onSurface, opacity: repeatOpacity }]}>
            {repeatLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  pullHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 12,
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    // Shadow for depth effect
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  trackArtist: {
    fontSize: 16,
  },
  seekSection: {
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryControl: {
    padding: 12,
  },
  controlIcon: {
    fontSize: 22,
  },
  transportButton: {
    padding: 16,
  },
  transportIcon: {
    fontSize: 28,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  playPauseIcon: {
    fontSize: 28,
  },
});
