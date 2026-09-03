import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function ActivityScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Activity Data"
        message="Connect a health source to see steps, active calories, and distance here."
      />
    </Screen>
  );
}
