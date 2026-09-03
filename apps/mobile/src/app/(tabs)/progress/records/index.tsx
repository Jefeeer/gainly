import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function PersonalRecordsScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Personal Records Yet"
        message="Log a set heavier or with more reps than before to set a PR."
      />
    </Screen>
  );
}
