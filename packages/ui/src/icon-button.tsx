import { type CSSProperties, type JSX, type ReactNode } from 'react';

import { useTheme } from './theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonProps = {
  /** Required — icon-only buttons must have an accessible label (§6). */
  'aria-label': string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
};

const SIZE: Record<IconButtonSize, number> = { sm: 36, md: 44, lg: 52 };

function variantColors(
  theme: ReturnType<typeof useTheme>,
  variant: IconButtonVariant,
): { background: string; icon: string; border: string } {
  const c = theme.colors;
  switch (variant) {
    case 'primary':
      return { background: c.primary, icon: c.onPrimary, border: 'transparent' };
    case 'secondary':
      return { background: c.primaryTint, icon: c.primaryStrong, border: 'transparent' };
    case 'outline':
      return { background: 'transparent', icon: c.textPrimary, border: c.borderStrong };
    case 'ghost':
      return { background: 'transparent', icon: c.textPrimary, border: 'transparent' };
    case 'destructive':
      return { background: c.error, icon: '#FFFFFF', border: 'transparent' };
  }
}

/**
 * Icon-only button — minimum 44×44 touch target (§6, §49).
 * Requires `aria-label` because there is no visible text label.
 */
export function IconButton({
  'aria-label': ariaLabel,
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  style,
}: IconButtonProps): JSX.Element {
  const theme = useTheme();
  const dimension = SIZE[size];
  const v = variantColors(theme, variant);
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      style={{
        width: dimension,
        height: dimension,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radii.md,
        border: `1px solid ${v.border}`,
        backgroundColor: v.background,
        color: v.icon,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        transition: `background-color ${theme.motion.fast} ${theme.motion.easeStandard}`,
        ...style,
      }}
    >
      {icon}
    </button>
  );
}
