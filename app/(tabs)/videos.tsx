import React from 'react';
import { View } from 'react-native';
import { VideoFeed } from '../../src/features/videos/VideoFeed';

export default function VideosScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <VideoFeed />
    </View>
  );
}
