import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function FitnessGoalsScreen() {
  return (
    <Screen centered>
      <EmptyState title="No Fitness Goals Set" message="Set a fitness goal to track your progress toward it." />
    </Screen>
  );
}
