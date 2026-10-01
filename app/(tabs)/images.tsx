import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ImagesGrid } from '../../src/features/images/ImagesGrid';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function ImagesScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.onBackground }]}>Images</Text>
      </View>
      <ImagesGrid />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
