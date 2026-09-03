import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen name="settings/about" options={{ title: 'About' }} />
      <Stack.Screen name="goals/index" options={{ title: 'Fitness Goals' }} />
      <Stack.Screen name="subscription/index" options={{ title: 'Subscription' }} />
    </Stack>
  );
}
