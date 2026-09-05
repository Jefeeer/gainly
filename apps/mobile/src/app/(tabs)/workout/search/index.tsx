import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { workoutGuideProvider, type Exercise } from '@gainly/exercises';

const DEBOUNCE_MS = 200;

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

  return (
    <Screen>
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

      {/* Exercise list */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.slug}
        renderItem={renderItem}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  searchInput: {
    height: 44,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  chipList: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  count: {
    marginBottom: Spacing.one,
  },
  list: {
    gap: Spacing.one,
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
