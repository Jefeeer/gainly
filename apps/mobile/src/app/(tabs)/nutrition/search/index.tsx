import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function FoodSearchScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="Search for a Food"
        message="Search the food catalog or add a custom food to log it."
      />
    </Screen>
  );
}
