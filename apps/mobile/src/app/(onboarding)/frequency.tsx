import { useState } from 'react';

import { Button } from '@/components/button';
import { OptionRow } from '@/components/option-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function FrequencyScreen() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <Screen>
      <ThemedText type="h1">How many days a week?</ThemedText>
      {DAYS.map((day) => (
        <OptionRow
          key={day}
          label={`${day} day${day > 1 ? 's' : ''} per week`}
          selected={selected === day}
          onPress={() => setSelected(day)}
        />
      ))}
      <Button label="Continue" href="/nutrition-goal" />
    </Screen>
  );
}
