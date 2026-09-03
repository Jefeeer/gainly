import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';

export default function PersonalInfoScreen() {
  return (
    <Screen>
      <ThemedText type="h1">Tell us about yourself</ThemedText>
      <TextField label="Date of Birth" placeholder="MM/DD/YYYY" />
      <TextField label="Height" placeholder="e.g. 175 cm" keyboardType="numeric" />
      <TextField label="Weight" placeholder="e.g. 70 kg" keyboardType="numeric" />
      <TextField label="Sex" placeholder="Male / Female / Other" />
      <Button label="Continue" href="/frequency" />
    </Screen>
  );
}
