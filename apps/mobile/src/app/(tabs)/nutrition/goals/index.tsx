import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function NutritionGoalsScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Nutrition Goals Set"
        message="Set a calorie and macro goal to see your daily progress."
      />
    </Screen>
  );
}
