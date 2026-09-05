import { Stack } from 'expo-router';

export default function ProgressLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Progress' }} />
      <Stack.Screen name="records/index" options={{ title: 'Personal Records' }} />
      <Stack.Screen name="history/index" options={{ title: 'Workout History' }} />
      <Stack.Screen name="body/index" options={{ title: 'Body & Measurements' }} />
      <Stack.Screen name="activity/index" options={{ title: 'Activity' }} />
    </Stack>
  );
}
