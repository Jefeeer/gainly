import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Workout' }} />
      <Stack.Screen name="templates/index" options={{ title: 'Templates' }} />
      <Stack.Screen name="programs/index" options={{ title: 'Programs' }} />
    </Stack>
  );
}
