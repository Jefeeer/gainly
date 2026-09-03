import { useState } from 'react';

import { Button } from '@/components/button';
import { OptionRow } from '@/components/option-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

const GOALS = ['Lose Weight (Cut)', 'Maintain', 'Gain Weight (Bulk)'];

export default function NutritionGoalScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Screen>
      <ThemedText type="h1">Nutrition goal</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Optional - you can set this later in Nutrition Goals.
      </ThemedText>
      {GOALS.map((goal) => (
        <OptionRow key={goal} label={goal} selected={selected === goal} onPress={() => setSelected(goal)} />
      ))}
      <Button label="Continue" href="/first-launch" />
    </Screen>
  );
}
