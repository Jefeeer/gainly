import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CardSkeleton } from '@/components/skeleton';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

type ProfileProps = {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export default function ProfileScreen({
  loading = false,
  error = null,
  onRetry,
}: ProfileProps) {
  if (loading) {
    return (
      <Screen>
        <ThemedText type="h1">Profile</ThemedText>
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
      <ThemedText type="h1">Profile</ThemedText>

      <Card>
        <EmptyState
          title="No Profile Yet"
          message="Sign in to see your goal, level, stats, and connected services here."
          ctaLabel="Sign In"
          ctaHref="/welcome"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Fitness Goals Set"
          message="Set a fitness goal to track your progress toward it."
          ctaLabel="View Goals"
          ctaHref="/profile/goals"
        />
      </Card>

      <Card>
        <EmptyState
          title="Free Plan"
          message="Upgrade to Gainly Pro for advanced progress tracking and programs."
          ctaLabel="View Subscription"
          ctaHref="/profile/subscription"
        />
      </Card>

      <Card>
        <EmptyState title="Settings" message="Account, units, notifications, and more." ctaLabel="Open Settings" ctaHref="/profile/settings" />
      </Card>
    </Screen>
  );
}
