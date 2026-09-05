import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CardSkeleton } from '@/components/skeleton';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/stores/auth';

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
  const user = useAuth((s) => s.user);

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

  // Authenticated user — show profile info
  if (user) {
    return (
      <Screen>
        <ThemedText type="h1">Profile</ThemedText>

        <Card>
          <ThemedText type="h3">{user.displayName ?? 'Gainly User'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user.email}
          </ThemedText>
        </Card>

        {!user.onboardingCompletedAt ? (
          <Card>
            <EmptyState
              title="Complete Your Profile"
              message="Finish setting up your profile to get personalized recommendations."
              ctaLabel="Complete Setup"
              ctaHref="/(onboarding)/goal"
            />
          </Card>
        ) : null}

        <Card>
          <EmptyState
            title="No Fitness Goals Set"
            message="Set a fitness goal to track your progress toward it."
            ctaLabel="View Goals"
            ctaHref="/(tabs)/profile/goals"
          />
        </Card>

        <Card>
          <EmptyState
            title="Free Plan"
            message="Upgrade to Gainly Pro for advanced progress tracking and programs."
            ctaLabel="View Subscription"
            ctaHref="/(tabs)/profile/subscription"
          />
        </Card>
      </Screen>
    );
  }

  // Unauthenticated — show sign-in prompt
  return (
    <Screen>
      <ThemedText type="h1">Profile</ThemedText>

      <Card>
        <EmptyState
          title="No Profile Yet"
          message="Sign in to see your goal, level, stats, and connected services here."
          ctaLabel="Sign In"
          ctaHref="/(auth)/welcome"
        />
      </Card>

      <Card>
        <EmptyState
          title="No Fitness Goals Set"
          message="Set a fitness goal to track your progress toward it."
          ctaLabel="View Goals"
          ctaHref="/(tabs)/profile/goals"
        />
      </Card>

      <Card>
        <EmptyState
          title="Free Plan"
          message="Upgrade to Gainly Pro for advanced progress tracking and programs."
          ctaLabel="View Subscription"
          ctaHref="/(tabs)/profile/subscription"
        />
      </Card>
    </Screen>
  );
}
