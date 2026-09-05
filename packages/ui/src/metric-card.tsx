import { type CSSProperties, type JSX, type ReactNode } from 'react';

import { Text } from './typography';
import { Card } from './card';
import { useTheme } from './theme';

export type MetricCardProps = {
  /** The primary metric value — rendered in metric-md mono (§6). */
  value: string | number;
  /** Caption label below the value. */
  label: string;
  /** Optional trend indicator — ▲/▼ glyph, never color-only for direction (§6). */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
  };
  /** Optional icon slot. */
  icon?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
};

const TREND_GLYPHS = { up: '▲', down: '▼', neutral: '—' } as const;

/**
 * MetricCard / StatCard — metric-md value + caption label + optional trend chip (§6).
 * Trend uses ▲/▼ glyphs, never color-only for direction.
 */
export function MetricCard({
  value,
  label,
  trend,
  icon,
  onClick,
  style,
}: MetricCardProps): JSX.Element {
  const theme = useTheme();

  return (
    <Card pressable={!!onClick} onClick={onClick} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing[3] }}>
        {icon ? (
          <div style={{ color: theme.colors.primarySubtle, flexShrink: 0 }}>{icon}</div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1 }}>
          <Text variant="metricMd" style={{ fontVariant: ['tabular-nums'] }}>
            {value}
          </Text>
          <Text variant="caption" color="textSecondary">
            {label}
          </Text>
        </div>
        {trend ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[1],
              padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.surface2,
              flexShrink: 0,
            }}
          >
            <Text
              variant="label"
              color={
                trend.direction === 'up'
                  ? 'primary'
                  : trend.direction === 'down'
                    ? 'error'
                    : 'textSecondary'
              }
              style={{ fontSize: 12 }}
            >
              {TREND_GLYPHS[trend.direction]}
            </Text>
            {trend.value ? (
              <Text variant="label" color="textSecondary" style={{ fontSize: 12 }}>
                {trend.value}
              </Text>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
