import { useState } from 'react';

import { Button } from '@/components/button';
import { OptionRow } from '@/components/option-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

const GOALS = ['Build Muscle', 'Lose Fat', 'Get Stronger', 'Improve Endurance', 'General Fitness'];

export default function GoalScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Screen>
      <ThemedText type="h1">What&apos;s your goal?</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        This helps us tailor your workout recommendations.
      </ThemedText>
      {GOALS.map((goal) => (
        <OptionRow key={goal} label={goal} selected={selected === goal} onPress={() => setSelected(goal)} />
      ))}
      <Button label="Continue" href="/experience" />
    </Screen>
  );
}
