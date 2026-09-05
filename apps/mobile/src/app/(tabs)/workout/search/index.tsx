/**
 * Exercise Search — search/browse screen with WG provider integration.
 * Fixed: use FlatList as root instead of nesting inside Screen's ScrollView.
 */

import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { workoutGuideProvider, type Exercise } from '@gainly/exercises';

export default function ExerciseSearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const facets = workoutGuideProvider.facets();

  const results = useMemo(() => {
    const filters = selectedMuscle ? { primaryMuscle: selectedMuscle } : undefined;
    return workoutGuideProvider.search(query || undefined, filters);
  }, [query, selectedMuscle]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Link href={`/(tabs)/workout/search/${item.slug}`} asChild>
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
          <Image
            source={{ uri: workoutGuideProvider.assetUrl(item.slug, 1) ?? undefined }}
            style={styles.thumbnail}
            contentFit="contain"
            transition={200}
          />
          <View style={styles.rowContent}>
            <ThemedText type="default" numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.primaryMuscle} · {item.equipment}
            </ThemedText>
          </View>
        </Pressable>
      </Link>
    ),
    [],
  );

  const ListHeader = useMemo(() => () => (
    <View>
      {/* Search input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundElement }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search exercises..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* Muscle filter chips */}
      <FlatList
        horizontal
        data={facets.primaryMuscles}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => {
          const isSelected = selectedMuscle === item;
          return (
            <Pressable
              onPress={() => setSelectedMuscle(isSelected ? null : item)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText
                type="smallBold"
                themeColor={isSelected ? 'onPrimary' : 'textSecondary'}
              >
                {item}
              </ThemedText>
            </Pressable>
          );
        }}
      />

      {/* Results count */}
      <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
        {results.length} exercise{results.length !== 1 ? 's' : ''}
      </ThemedText>
    </View>
  ), [query, selectedMuscle, facets.primaryMuscles, results.length, theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.slug}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText type="h3" style={styles.emptyTitle}>
              No Exercises Found
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Try a different search or filter.
            </ThemedText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  searchInput: {
    height: 44,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  chipList: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  count: {
    marginBottom: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    textAlign: 'center',
  },
});
