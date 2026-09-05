import { type CSSProperties, type JSX } from 'react';

import { Text } from './typography';
import { useTheme } from './theme';

export type ProgressBarProps = {
  /** Value between 0 and 1. */
  value: number;
  /** Optional label shown next to or below the bar. */
  label?: string;
  /** Show the percentage value as text (§6: value conveyed by fill AND numeric label). */
  showValue?: boolean;
  height?: number;
  style?: CSSProperties;
};

/**
 * Progress bar — value conveyed by fill AND a numeric label, never bar length alone (§6).
 * Used for goal completion, calorie tracking, etc.
 */
export function ProgressBar({
  value,
  label,
  showValue = true,
  height = 8,
  style,
}: ProgressBarProps): JSX.Element {
  const theme = useTheme();
  const clampedValue = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clampedValue * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], ...style }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label ? (
            <Text variant="caption" color="textSecondary">
              {label}
            </Text>
          ) : null}
          {showValue ? (
            <Text variant="label" color="textSecondary">
              {percentage}%
            </Text>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${percentage}% complete`}
        style={{
          width: '100%',
          height,
          borderRadius: theme.radii.full,
          backgroundColor: theme.colors.surface2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: theme.radii.full,
            backgroundColor: theme.colors.primary,
            transition: `width ${theme.motion.base} ${theme.motion.easeStandard}`,
          }}
        />
      </div>
    </div>
  );
}
