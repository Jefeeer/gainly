// Unit conversion helpers — metric ↔ imperial.
// §89: Support kg/lb, cm/inches, km/miles, ml/fl_oz.
// All conversions use exact factors; results are rounded to 2 decimal places.

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;
const KM_PER_MILE = 1.609344;
const ML_PER_FLOZ = 29.5735295625;

/** Weight: kg → lb */
export function kgToLb(kg: number): number {
  return round2(kg / KG_PER_LB);
}

/** Weight: lb → kg */
export function lbToKg(lb: number): number {
  return round2(lb * KG_PER_LB);
}

/** Distance: cm → inches */
export function cmToInches(cm: number): number {
  return round2(cm / CM_PER_INCH);
}

/** Distance: inches → cm */
export function inchesToCm(inches: number): number {
  return round2(inches * CM_PER_INCH);
}

/** Distance: km → miles */
export function kmToMiles(km: number): number {
  return round2(km / KM_PER_MILE);
}

/** Distance: miles → km */
export function milesToKm(miles: number): number {
  return round2(miles * KM_PER_MILE);
}

/** Volume: ml → fl oz */
export function mlToFlOz(ml: number): number {
  return round2(ml / ML_PER_FLOZ);
}

/** Volume: fl oz → ml */
export function flOzToMl(flOz: number): number {
  return round2(flOz * ML_PER_FLOZ);
}

/**
 * Format a weight value with the appropriate unit label.
 */
export function formatWeight(value: number, unit: 'kg' | 'lb'): string {
  return `${value} ${unit}`;
}

/**
 * Format a distance value with the appropriate unit label.
 */
export function formatDistance(value: number, unit: 'km' | 'miles'): string {
  return `${value} ${unit}`;
}

/**
 * Format a measurement value with the appropriate unit label.
 */
export function formatMeasurement(value: number, unit: 'cm' | 'inches'): string {
  return `${value} ${unit}`;
}

/**
 * Format a volume value with the appropriate unit label.
 */
export function formatVolume(value: number, unit: 'ml' | 'fl_oz'): string {
  const label = unit === 'fl_oz' ? 'fl oz' : 'ml';
  return `${value} ${label}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
