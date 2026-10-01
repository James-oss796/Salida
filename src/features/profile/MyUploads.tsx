import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import { getPublicUrl } from '../../lib/storage';

type UploadType = 'videos' | 'tracks' | 'images';

export function MyUploads() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<UploadType>('videos');

  // Fetch
  const { data, isLoading } = useQuery({
    queryKey: ['myUploads', activeTab, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from(activeTab)
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type, item }: { id: string, type: UploadType, item: any }) => {
      // 1. Delete files from storage
      if (type === 'videos') {
        await supabase.storage.from('videos').remove([item.video_path]);
        if (item.thumbnail_path) await supabase.storage.from('thumbnails').remove([item.thumbnail_path]);
      } else if (type === 'tracks') {
        await supabase.storage.from('music').remove([item.audio_path]);
        if (item.cover_path) await supabase.storage.from('thumbnails').remove([item.cover_path]);
      } else if (type === 'images') {
        await supabase.storage.from('images').remove([item.image_path]);
        if (item.thumbnail_path) await supabase.storage.from('thumbnails').remove([item.thumbnail_path]);
      }

      // 2. Delete row from DB
      const { error } = await supabase.from(type).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myUploads'] });
      // Invalidate global feeds too
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error: any) => {
      Alert.alert('Delete Failed', error.message);
    }
  });

  const handleDelete = (id: string, item: any) => {
    Alert.alert('Delete Upload', 'Are you sure you want to delete this? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate({ id, type: activeTab, item }) }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    let title = item.title || 'Untitled Image';
    let sub = item.caption || item.artist || '';
    let thumbPath = item.thumbnail_path || item.cover_path || item.image_path;
    let thumbUrl = getPublicUrl(activeTab === 'images' ? 'images' : 'thumbnails', thumbPath); // fallback if thumbnails bucket used for images too

    // For images, thumbnail is in thumbnails bucket, but original is in images bucket.
    // In our upload script we put image thumbnails in 'thumbnails' bucket.
    if (activeTab === 'images') thumbUrl = getPublicUrl('thumbnails', item.thumbnail_path);

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.surfaceVariant }]}>
        <Image source={thumbUrl} style={styles.thumbnail} contentFit="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { color: theme.onSurface }]} numberOfLines={1}>{title}</Text>
          {sub ? <Text style={[styles.sub, { color: theme.onSurfaceMuted }]} numberOfLines={1}>{sub}</Text> : null}
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id, item)}>
          <Text style={{ color: theme.error, fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['videos', 'tracks', 'images'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabPill,
              { backgroundColor: activeTab === tab ? theme.primary : theme.surfaceVariant },
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

      {/* List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: theme.onSurfaceMuted }}>No {activeTab} uploaded yet.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 12,
  },
});
