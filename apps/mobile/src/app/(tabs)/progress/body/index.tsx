/**
 * Body & Measurements — §20: weight, body fat, measurements.
 * §89: kg/lb, cm/inches support.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBodyMetrics } from '@/stores/body-metrics';

export default function BodyMeasurementsScreen() {
  const theme = useTheme();
  const { logWeight, logMeasurement, getLatestWeight, getWeightHistory } = useBodyMetrics();
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [showLogMeasurement, setShowLogMeasurement] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [measurementInputs, setMeasurementInputs] = useState({
    waist: '',
    chest: '',
    arms: '',
    thighs: '',
    hips: '',
    neck: '',
    bodyFat: '',
  });

  const latestWeight = getLatestWeight();
  const weightHistory = getWeightHistory(30);

  function handleLogWeight() {
    const weight = parseFloat(weightInput);
    if (!isNaN(weight) && weight > 0) {
      logWeight(weight);
      setWeightInput('');
      setShowLogWeight(false);
    }
  }

  function handleLogMeasurement() {
    const data: Record<string, number | null> = {};
    for (const [key, val] of Object.entries(measurementInputs)) {
      const num = parseFloat(val);
      data[key === 'bodyFat' ? 'bodyFatPct' : `${key}Cm`] = isNaN(num) ? null : num;
    }
    logMeasurement(data);
    setMeasurementInputs({ waist: '', chest: '', arms: '', thighs: '', hips: '', neck: '', bodyFat: '' });
    setShowLogMeasurement(false);
  }

  return (
    <Screen>
      <ThemedText type="h1">Body & Measurements</ThemedText>

      {/* Current weight */}
      <View style={styles.statsRow}>
        <MetricCard
          value={latestWeight ? `${latestWeight.weightKg} kg` : '—'}
          label="Current Weight"
        />
        <MetricCard
          value={weightHistory.length.toString()}
          label="Entries (30d)"
        />
      </View>

      {/* Log weight */}
      <Card>
        <Pressable onPress={() => setShowLogWeight(!showLogWeight)}>
          <ThemedText type="h3">Log Weight</ThemedText>
        </Pressable>
        {showLogWeight ? (
          <View style={styles.logForm}>
            <TextField
              label="Weight (kg)"
              placeholder="70.5"
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
            />
            <Button label="Save" size="sm" onPress={handleLogWeight} />
          </View>
        ) : null}
      </Card>

      {/* Log measurements */}
      <Card>
        <Pressable onPress={() => setShowLogMeasurement(!showLogMeasurement)}>
          <ThemedText type="h3">Log Measurements</ThemedText>
        </Pressable>
        {showLogMeasurement ? (
          <View style={styles.logForm}>
            <View style={styles.measurementGrid}>
              {[
                { key: 'waist', label: 'Waist (cm)' },
                { key: 'chest', label: 'Chest (cm)' },
                { key: 'arms', label: 'Arms (cm)' },
                { key: 'thighs', label: 'Thighs (cm)' },
                { key: 'hips', label: 'Hips (cm)' },
                { key: 'neck', label: 'Neck (cm)' },
                { key: 'bodyFat', label: 'Body Fat %' },
              ].map(({ key, label }) => (
                <TextField
                  key={key}
                  label={label}
                  placeholder="—"
                  keyboardType="numeric"
                  value={measurementInputs[key as keyof typeof measurementInputs]}
                  onChangeText={(v) =>
                    setMeasurementInputs((prev) => ({ ...prev, [key]: v }))
                  }
                />
              ))}
            </View>
            <Button label="Save Measurements" size="sm" onPress={handleLogMeasurement} />
          </View>
        ) : null}
      </Card>

      {/* Recent weight entries */}
      {weightHistory.length > 0 ? (
        <Card>
          <ThemedText type="h3">Recent Weigh-ins</ThemedText>
          {weightHistory.slice(0, 7).map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <ThemedText type="default">{entry.weightKg} kg</ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                {new Date(entry.recordedAt).toLocaleDateString()}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {weightHistory.length === 0 && !showLogWeight ? (
        <Card>
          <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
            Start logging your weight to see trends over time.
          </ThemedText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  logForm: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  measurementGrid: {
    gap: Spacing.three,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
