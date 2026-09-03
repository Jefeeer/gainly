import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function ActiveWorkoutScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Active Workout"
        message="Start a workout from the Workout tab to begin logging sets."
        ctaLabel="Go to Workout"
        ctaHref="/workout"
      />
    </Screen>
  );
}
