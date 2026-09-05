import { type CSSProperties, type JSX, type ReactNode } from 'react';

import { Text } from './typography';
import { useTheme } from './theme';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Selected state — uses primary/tint-bg + primary/strong text (§6). */
  selected?: boolean;
  /** Pressable badge (for filter chips). */
  onPress?: () => void;
  style?: CSSProperties;
};

function variantColors(
  theme: ReturnType<typeof useTheme>,
  variant: BadgeVariant,
  selected: boolean,
): { bg: string; text: string } {
  const c = theme.colors;
  if (selected) {
    // Selected state: primary/tint-bg + primary/strong text (§6 Chip selected state).
    return { bg: c.primaryTint, text: c.primaryStrong };
  }
  switch (variant) {
    case 'default':
      return { bg: c.surface2, text: c.textSecondary };
    case 'primary':
      return { bg: c.primaryTint, text: c.primaryStrong };
    case 'success':
      return { bg: c.primaryTint, text: c.primaryStrong };
    case 'warning':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'error':
      return { bg: '#FEE2E2', text: '#991B1B' };
  }
}

/**
 * Badge / Chip — status or filter tag (§6).
 * Selected state uses primary/tint-bg + primary/strong text, never fill-only.
 */
export function Badge({
  children,
  variant = 'default',
  selected = false,
  onPress,
  style,
}: BadgeProps): JSX.Element {
  const theme = useTheme();
  const v = variantColors(theme, variant, selected);

  const content = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
        borderRadius: theme.radii.sm,
        backgroundColor: v.bg,
        cursor: onPress ? 'pointer' : undefined,
        transition: `background-color ${theme.motion.fast} ${theme.motion.easeStandard}`,
        ...style,
      }}
    >
      <Text variant="label" color={selected ? 'primaryStrong' : 'textSecondary'} style={{ color: v.text }}>
        {children}
      </Text>
    </span>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-pressed={selected}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {content}
      </button>
    );
  }

  return content;
}
