import { type CSSProperties, type JSX } from 'react';

import { Spinner } from './states';
import { Text } from './typography';
import { useTheme } from './theme';
import { type Theme } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
};

const SIZE: Record<ButtonSize, { height: number; paddingX: number; fontSize: number }> = {
  sm: { height: 36, paddingX: 12, fontSize: 13 },
  md: { height: 44, paddingX: 16, fontSize: 16 },
  lg: { height: 52, paddingX: 20, fontSize: 16 },
};

/** Resolve fill / label / border for a variant against the active theme. */
function variantColors(theme: Theme, variant: ButtonVariant): {
  background: string;
  label: string;
  border: string;
} {
  const c = theme.colors;
  switch (variant) {
    case 'primary':
      // onPrimary is the theme-correct label — white in light, bg/base in dark (the AA trap).
      return { background: c.primary, label: c.onPrimary, border: 'transparent' };
    case 'secondary':
      return { background: c.primaryTint, label: c.primaryStrong, border: 'transparent' };
    case 'outline':
      return { background: 'transparent', label: c.textPrimary, border: c.borderStrong };
    case 'ghost':
      return { background: 'transparent', label: c.textPrimary, border: 'transparent' };
    case 'destructive':
      // error fills carry white labels in both themes (§2 table: white on error = 4.83:1 AA).
      return { background: c.error, label: '#FFFFFF', border: 'transparent' };
  }
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  style,
}: ButtonProps): JSX.Element {
  const theme = useTheme();
  const s = SIZE[size];
  const v = variantColors(theme, variant);
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      style={{
        // min 44x44 hit target at md/lg; sm is 36 tall but keep a comfortable width (§49/§6).
        position: 'relative',
        minHeight: s.height,
        minWidth: 44,
        height: s.height,
        paddingLeft: s.paddingX,
        paddingRight: s.paddingX,
        borderRadius: theme.radii.md,
        border: `1px solid ${v.border}`,
        backgroundColor: v.background,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `background-color ${theme.motion.fast} ${theme.motion.easeStandard}`,
        ...style,
      }}
    >
      {/* Loading swaps the label for a spinner but keeps width: label stays laid out, just hidden. */}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        <Text variant="label" style={{ fontSize: s.fontSize, color: v.label }}>
          {label}
        </Text>
      </span>
      {loading ? (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size={s.fontSize + 4} color={v.label} />
        </span>
      ) : null}
    </button>
  );
}
