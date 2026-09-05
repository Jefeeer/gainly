import { describe, expect, it } from 'vitest';

import { formatReport, runImport } from '../../../scripts/import-workout-guide';

describe('runImport', () => {
  it('discovers all 302 WG exercises', () => {
    const report = runImport();
    expect(report.discovered).toBe(302);
  });

  it('validates and maps exercises without errors', () => {
    const report = runImport();
    expect(report.errors).toBe(0);
    expect(report.skipped).toBe(0);
  });

  it('produces mapping warnings for lossy muscle/equipment mappings', () => {
    const report = runImport();
    // WG has known lossy muscles (Lats, Upper Back, Rear Delts, Legs, etc.)
    expect(report.mappingWarnings.muscle.length).toBeGreaterThan(0);
    // WG has known unsupported equipment (Pull-up Bar, Wall, Towel, etc.)
    expect(report.mappingWarnings.equipment.length).toBeGreaterThan(0);
  });

  it('all exercises get valid Gainly exercise types', () => {
    const report = runImport();
    // No skipped exercises means all types mapped successfully
    expect(report.skipped).toBe(0);
  });
});

describe('formatReport', () => {
  it('formats the report as a readable string', () => {
    const report = runImport();
    const formatted = formatReport(report);
    expect(formatted).toContain('Workout Guide import');
    expect(formatted).toContain('discovered:');
    expect(formatted).toContain('302');
  });
});
