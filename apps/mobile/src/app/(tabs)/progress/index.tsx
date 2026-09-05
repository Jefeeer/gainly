import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CardSkeleton } from '@/components/skeleton';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

type ProgressProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export default function ProgressOverviewScreen({
  loading = false,
  error = null,
  onRetry,
}: ProgressProps) {
  if (loading) {
    return (
      <Screen>
        <ThemedText type="h1">Progress</ThemedText>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
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
      <ThemedText type="h1">Progress</ThemedText>

      <Card>
        <EmptyState
          title="No Progress Yet"
          message="Your progress starts with your first rep."
          ctaLabel="Start Workout"
          ctaHref="/workout"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Personal Records Yet"
          message="Log a set heavier or with more reps than before to set a PR."
          ctaLabel="View Records"
          ctaHref="/progress/records"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Measurements Logged"
          message="Track body weight and measurements over time."
          ctaLabel="View Body & Measurements"
          ctaHref="/progress/body"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Activity Data"
          message="Connect a health source to see steps, active calories, and distance."
          ctaLabel="View Activity"
          ctaHref="/progress/activity"
        />
      </Card>
    </Screen>
  );
}
