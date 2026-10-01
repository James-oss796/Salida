import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { SongsList } from '../../../src/features/music/SongsList';

export default function MusicScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists' | 'liked'>('songs');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.onBackground }]}>Music</Text>
      </View>

      <View style={styles.tabsRow}>
        {(['songs', 'playlists', 'liked'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabPill,
              {
                backgroundColor: activeTab === tab ? theme.primary : theme.surfaceVariant,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.onPrimary : theme.onSurface },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'songs' && <SongsList />}
      {activeTab === 'playlists' && (
        <View style={styles.placeholder}>
          <Text style={{ color: theme.onSurfaceMuted }}>Playlists coming soon...</Text>
        </View>
      )}
      {activeTab === 'liked' && (
        <View style={styles.placeholder}>
          <Text style={{ color: theme.onSurfaceMuted }}>Liked songs coming soon...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  tabText: {
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
