import { useState, type CSSProperties, type JSX } from 'react';

import { Text } from './typography';
import { useTheme } from './theme';

export type InputProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  /** Error message shown below the field; also flips the border and shows a leading icon. */
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  id?: string;
  style?: CSSProperties;
};

/** Small alert glyph so the error is signalled by an icon, not color alone (§49). */
function AlertGlyph({ color }: { color: string }): JSX.Element {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Input({
  label,
  value,
  defaultValue,
  placeholder,
  type = 'text',
  error,
  disabled = false,
  onChange,
  id,
  style,
}: InputProps): JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const fieldId = id ?? `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const borderColor = error ? theme.colors.error : focused ? theme.colors.primarySubtle : theme.colors.borderStrong;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], ...style }}>
      {/* Label above the field, never placeholder-as-label — placeholder vanishes once typing (§49). */}
      <label htmlFor={fieldId}>
        <Text variant="label" as="span" color="textSecondary">
          {label}
        </Text>
      </label>
      <input
        id={fieldId}
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 44,
          padding: `0 ${theme.spacing[3]}px`,
          borderRadius: theme.radii.sm,
          border: `1px solid ${borderColor}`,
          backgroundColor: theme.colors.surface2,
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamily.sans,
          fontSize: theme.typography.body.fontSize,
          // 2px primary/subtle outset focus ring (§6).
          boxShadow: focused && !error ? `0 0 0 2px ${theme.colors.primarySubtle}` : 'none',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {error ? (
        <div id={`${fieldId}-error`} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
          <AlertGlyph color={theme.colors.error} />
          <Text variant="caption" color="error">
            {error}
          </Text>
        </div>
      ) : null}
    </div>
  );
}
