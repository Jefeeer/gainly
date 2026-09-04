import { type CSSProperties, type JSX, type ReactNode } from 'react';

import { useTheme } from './theme';
import { type ColorTokens, type TypographyVariant } from './tokens';

export type TextProps = {
  variant?: TypographyVariant;
  /** Any text-role color token; defaults to textPrimary. */
  color?: keyof Pick<
    ColorTokens,
    'textPrimary' | 'textSecondary' | 'textMuted' | 'primary' | 'primaryStrong' | 'error' | 'warning' | 'info' | 'onPrimary'
  >;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'label' | 'div';
  style?: CSSProperties;
  children: ReactNode;
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  as: Tag = 'span',
  style,
  children,
}: TextProps): JSX.Element {
  const theme = useTheme();
  const t = theme.typography[variant];

  return (
    <Tag
      style={{
        margin: 0,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        lineHeight: `${t.lineHeight}px`,
        fontWeight: t.fontWeight,
        letterSpacing: 'letterSpacing' in t ? t.letterSpacing : undefined,
        color: theme.colors[color],
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
