import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function WaterScreen() {
  return (
    <Screen centered>
      <EmptyState title="No Water Logged Today" message="Log water in quick 250/500/750ml amounts, or a custom amount." />
    </Screen>
  );
}
