import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function WorkoutHomeScreen() {
  return (
    <Screen>
      <ThemedText type="h1">Workout</ThemedText>

      <Button label="Start Empty Workout" href="/workout/active" />

      <Card>
        <EmptyState
          title="No Templates Yet"
          message="Save a workout as a template to reuse it later."
          ctaLabel="View Templates"
          ctaHref="/workout/templates"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Programs Yet"
          message="Programs schedule your workouts across weeks."
          ctaLabel="View Programs"
          ctaHref="/workout/programs"
        />
      </Card>
    </Screen>
  );
}
