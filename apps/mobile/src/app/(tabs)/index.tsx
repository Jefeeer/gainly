import { Card } from '@/components/card';
import { DashboardSkeleton } from '@/components/skeleton';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

type HomeScreenProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  userName?: string;
  streak?: number;
  todayWorkout?: { name: string; exercises: number; duration: string } | null;
  calories?: { consumed: number; goal: number } | null;
};

export default function HomeScreen({
  loading = false,
  error = null,
  onRetry,
}: HomeScreenProps) {
  const today = WEEKDAY_FORMATTER.format(new Date());

  if (loading) {
    return (
      <Screen>
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen centered>
        <ErrorState message={error} onRetry={onRetry} />
      </Screen>
    );
  }

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
    </Screen>
  );
}
