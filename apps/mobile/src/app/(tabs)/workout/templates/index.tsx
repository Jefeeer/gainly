import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function TemplatesScreen() {
  return (
    <Screen centered>
      <EmptyState
        title="No Templates Yet"
        message="Finish a workout and save it as a template to see it here."
      />
    </Screen>
  );
}
