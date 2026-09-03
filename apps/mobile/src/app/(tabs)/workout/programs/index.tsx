import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function ProgramsScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Programs Yet"
        message="Programs schedule your workouts across weeks. Create one to see it here."
      />
    </Screen>
  );
}
