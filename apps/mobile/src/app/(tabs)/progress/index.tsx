import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function ProgressOverviewScreen() {
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
