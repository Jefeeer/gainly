import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <Screen>
      <ThemedText type="h1">About Gainly</ThemedText>
      <Card>
        <Link href="/attribution" asChild>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedText type="default">Open Source Licenses</ThemedText>
          </Pressable>
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});
