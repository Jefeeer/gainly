import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function SubscriptionScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="Free Plan"
        message="Upgrade to Gainly Pro for advanced progress tracking and programs."
      />
    </Screen>
  );
}
