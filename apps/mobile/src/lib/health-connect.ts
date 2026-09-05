/**
 * Health integrations — §27 Apple HealthKit, §28 Android Health Connect.
 * §29: least-privilege permissions, store in health_connections.
 */

import { Platform } from 'react-native';

export type HealthDataType = 'steps' | 'heart_rate' | 'active_calories' | 'weight' | 'body_fat' | 'distance' | 'sleep' | 'workouts';

export type HealthProviderType = 'apple_health' | 'android_health';

/**
 * Get the appropriate health provider for the current platform.
 */
export function getHealthProvider(): HealthProviderType {
  return Platform.OS === 'ios' ? 'apple_health' : 'android_health';
}

/**
 * Check if health permissions are available on this device.
 * In production, this would use expo-health or native modules.
 */
export async function isHealthAvailable(): Promise<boolean> {
  // In production: check expo-health availability
  // For now, return false since we don't have the native module
  return false;
}

/**
 * Request health permissions for specific data types.
 * §27-§28: least-privilege — request only what's needed.
 */
export async function requestHealthPermissions(dataTypes: HealthDataType[]): Promise<boolean> {
  // In production: use expo-health or native HealthKit/Health Connect modules
  // Request only the specific data types needed
  console.log(`[health] Would request permissions for: ${dataTypes.join(', ')}`);
  return false;
}

/**
 * Read health data for a specific type and date range.
 * Returns empty array when health integration is not available.
 */
export async function readHealthData(
  type: HealthDataType,
  startDate: Date,
  endDate: Date,
): Promise<{ value: number; date: string; source: string }[]> {
  // In production: read from HealthKit/Health Connect
  return [];
}

/**
 * Write health data (e.g., weight from Gainly to health app).
 */
export async function writeHealthData(
  type: HealthDataType,
  value: number,
  date: Date,
): Promise<boolean> {
  // In production: write to HealthKit/Health Connect
  return false;
}

/**
 * Get the list of health data types available on this platform.
 */
export function getAvailableDataTypes(): HealthDataType[] {
  if (Platform.OS === 'ios') {
    return ['steps', 'heart_rate', 'active_calories', 'weight', 'body_fat', 'distance', 'sleep', 'workouts'];
  }
  return ['steps', 'heart_rate', 'active_calories', 'weight', 'distance', 'sleep', 'workouts'];
}
