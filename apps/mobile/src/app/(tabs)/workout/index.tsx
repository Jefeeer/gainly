import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ListSkeleton } from '@/components/skeleton';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

type WorkoutHomeProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  templates?: { id: string; name: string }[];
};

export default function WorkoutHomeScreen({
  loading = false,
  error = null,
  onRetry,
}: WorkoutHomeProps) {
  if (loading) {
    return (
      <Screen>
        <ThemedText type="h1">Workout</ThemedText>
        <ListSkeleton count={3} />
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
      <ThemedText type="h1">Workout</ThemedText>

      <Button label="Start Empty Workout" href="/workout/active" />
      <Button label="Find Exercise" href="/workout/search" />

      <Card>
        <EmptyState
          title="No Templates Yet"
          message="Save a workout as a template to reuse it later."
          ctaLabel="View Templates"
          ctaHref="/workout/templates"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Programs Yet"
          message="Programs schedule your workouts across weeks."
          ctaLabel="View Programs"
          ctaHref="/workout/programs"
        />
      </Card>
    </Screen>
  );
}
