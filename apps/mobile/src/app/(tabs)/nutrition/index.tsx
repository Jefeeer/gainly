import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function NutritionDayScreen() {
  return (
    <Screen>
      <ThemedText type="h1">Nutrition</ThemedText>

      <Card>
        <EmptyState
          title="No Meals Logged Yet"
          message="Log breakfast, lunch, dinner, or a snack to track your calories and macros."
          ctaLabel="Log Food"
          ctaHref="/nutrition/search"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Water Logged Today"
          message="Track your water intake throughout the day."
          ctaLabel="Log Water"
          ctaHref="/nutrition/water"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Nutrition Goals Set"
          message="Set a calorie and macro goal to see your daily progress."
          ctaLabel="Set Goals"
          ctaHref="/nutrition/goals"
        />
      </Card>
    </Screen>
  );
}
