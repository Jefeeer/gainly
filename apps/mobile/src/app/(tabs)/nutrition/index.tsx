import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CardSkeleton } from '@/components/skeleton';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

type NutritionProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export default function NutritionDayScreen({
  loading = false,
  error = null,
  onRetry,
}: NutritionProps) {
  if (loading) {
    return (
      <Screen>
        <ThemedText type="h1">Nutrition</ThemedText>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
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
