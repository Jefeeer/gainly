import { useState } from 'react';

import { Button } from '@/components/button';
import { OptionRow } from '@/components/option-row';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ExperienceScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Screen>
      <ThemedText type="h1">What&apos;s your experience level?</ThemedText>
      {LEVELS.map((level) => (
        <OptionRow key={level} label={level} selected={selected === level} onPress={() => setSelected(level)} />
      ))}
      <Button label="Continue" href="/personal-info" />
    </Screen>
  );
}
