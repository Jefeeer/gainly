import { Link } from 'expo-router';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function HomeScreen() {
  const today = WEEKDAY_FORMATTER.format(new Date());

  return (
    <Screen>
      <ThemedText type="smallBold" themeColor="primary">
        GAINLY
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        {today}
      </ThemedText>
      <ThemedText type="h1">Welcome to Gainly</ThemedText>

      <Card>
        <EmptyState
          title="No Workouts Yet"
          message="Your progress starts with your first rep."
          ctaLabel="Start Workout"
          ctaHref="/workout"
        />
      </Card>

      <Link href="/attribution">
        <ThemedText type="link" themeColor="textSecondary">
          About &amp; Open Source Licenses
        </ThemedText>
      </Link>
    </Screen>
  );
}
