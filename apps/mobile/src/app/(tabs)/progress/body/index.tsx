import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function BodyMeasurementsScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Measurements Logged"
        message="Track your body weight and measurements over time to see trends here."
      />
    </Screen>
  );
}
