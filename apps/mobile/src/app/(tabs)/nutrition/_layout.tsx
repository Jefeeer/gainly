import { Stack } from 'expo-router';

export default function NutritionLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Nutrition' }} />
      <Stack.Screen name="search/index" options={{ title: 'Food Search' }} />
      <Stack.Screen name="water/index" options={{ title: 'Water' }} />
      <Stack.Screen name="goals/index" options={{ title: 'Nutrition Goals' }} />
    </Stack>
  );
}
