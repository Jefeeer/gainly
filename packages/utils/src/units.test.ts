import { describe, expect, it } from 'vitest';

import {
  cmToInches,
  flOzToMl,
  formatDistance,
  formatMeasurement,
  formatVolume,
  formatWeight,
  inchesToCm,
  kgToLb,
  kmToMiles,
  lbToKg,
  milesToKm,
  mlToFlOz,
} from './units';

describe('weight conversions', () => {
  it('kgToLb: 100 kg ≈ 220.46 lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.46, 1);
  });

  it('lbToKg: 225 lb ≈ 102.06 kg', () => {
    expect(lbToKg(225)).toBeCloseTo(102.06, 1);
  });

  it('round-trips: kg → lb → kg preserves value', () => {
    const original = 82.5;
    expect(lbToKg(kgToLb(original))).toBeCloseTo(original, 2);
  });
});

describe('measurement conversions', () => {
  it('cmToInches: 180 cm ≈ 70.87 inches', () => {
    expect(cmToInches(180)).toBeCloseTo(70.87, 1);
  });

  it('inchesToCm: 72 inches ≈ 182.88 cm', () => {
    expect(inchesToCm(72)).toBeCloseTo(182.88, 1);
  });

  it('round-trips', () => {
    expect(inchesToCm(cmToInches(175))).toBeCloseTo(175, 2);
  });
});

describe('distance conversions', () => {
  it('kmToMiles: 5 km ≈ 3.11 miles', () => {
    expect(kmToMiles(5)).toBeCloseTo(3.11, 1);
  });

  it('milesToKm: 3 miles ≈ 4.83 km', () => {
    expect(milesToKm(3)).toBeCloseTo(4.83, 1);
  });
});

describe('volume conversions', () => {
  it('mlToFlOz: 500 ml ≈ 16.91 fl oz', () => {
    expect(mlToFlOz(500)).toBeCloseTo(16.91, 1);
  });

  it('flOzToMl: 16 fl oz ≈ 473.18 ml', () => {
    expect(flOzToMl(16)).toBeCloseTo(473.18, 1);
  });
});

describe('format helpers', () => {
  it('formatWeight includes unit', () => {
    expect(formatWeight(100, 'kg')).toBe('100 kg');
    expect(formatWeight(225, 'lb')).toBe('225 lb');
  });

  it('formatDistance includes unit', () => {
    expect(formatDistance(5, 'km')).toBe('5 km');
  });

  it('formatMeasurement includes unit', () => {
    expect(formatMeasurement(180, 'cm')).toBe('180 cm');
  });

  it('formatVolume includes correct label', () => {
    expect(formatVolume(500, 'ml')).toBe('500 ml');
    expect(formatVolume(16, 'fl_oz')).toBe('16 fl oz');
  });
});
