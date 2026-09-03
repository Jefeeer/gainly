import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="goal" options={{ title: 'Your Goal' }} />
      <Stack.Screen name="experience" options={{ title: 'Experience' }} />
      <Stack.Screen name="personal-info" options={{ title: 'About You' }} />
      <Stack.Screen name="frequency" options={{ title: 'Training Frequency' }} />
      <Stack.Screen name="nutrition-goal" options={{ title: 'Nutrition Goal' }} />
      <Stack.Screen name="first-launch" options={{ headerShown: false }} />
    </Stack>
  );
}
