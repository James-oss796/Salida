import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { VideoWithAuthor } from './api';
import { getPublicUrl } from '../../lib/storage';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../auth/store';
import { useVideoPlayer, VideoView } from 'expo-video';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
// Calculate an approximate tab bar height to deduct from windowHeight if needed, 
// though typically full-screen feeds just use full height and overlay the tabs
const FEED_ITEM_HEIGHT = windowHeight;

interface VideoItemProps {
  video: VideoWithAuthor;
  isActive: boolean;
  onLikePress?: () => void;
  onSharePress?: () => void;
}

export function VideoItem({ video, isActive, onLikePress, onSharePress }: VideoItemProps) {
  const { theme } = useTheme();
  const { requireAuth } = useAuthStore();
  const [isMuted, setIsMuted] = useState(false);
  
  const videoUrl = getPublicUrl('videos', video.video_path);
  
  const player = useVideoPlayer(videoUrl || '', player => {
    player.loop = true;
    player.muted = isMuted;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.seekBy(-player.currentTime); // Reset to beginning when not active
    }
  }, [isActive, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleLike = () => {
    requireAuth('like', () => {
      if (onLikePress) onLikePress();
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable style={styles.videoContainer} onPress={togglePlayPause}>
        <VideoView 
          player={player} 
          style={styles.video} 
          nativeControls={false}
          contentFit="cover"
        />
      </Pressable>

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.rightRail}>
          {/* Avatar (Placeholder for now) */}
          <View style={[styles.avatar, { backgroundColor: theme.surfaceVariant }]} />
          
          <TouchableOpacity style={styles.iconButton} onPress={handleLike}>
            <Text style={styles.iconText}>❤️</Text>
            <Text style={styles.iconLabel}>{video.like_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={onSharePress}>
            <Text style={styles.iconText}>↗️</Text>
            <Text style={styles.iconLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => setIsMuted(!isMuted)}>
            <Text style={styles.iconText}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{video.owner.username}</Text>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
          {video.caption ? (
            <Text style={styles.caption} numberOfLines={2}>{video.caption}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: FEED_ITEM_HEIGHT,
    width: windowWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    ...StyleSheet.absoluteFill as any,
  },
  video: {
    ...StyleSheet.absoluteFill as any,
  },
  overlay: {
    ...StyleSheet.absoluteFill as any,
    padding: 16,
    paddingBottom: 100, // Account for tab bar
    justifyContent: 'flex-end',
  },
  rightRail: {
    position: 'absolute',
    right: 16,
    bottom: 120, // Account for tab bar
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'white',
  },
  iconButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  iconLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottomInfo: {
    width: '80%',
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
});
