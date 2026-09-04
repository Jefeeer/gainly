import { type CSSProperties, type JSX, type ReactNode } from 'react';

import { useTheme } from './theme';

export type CardProps = {
  children: ReactNode;
  /** elevation-1 (flat card) by default; pressable lifts to elevation-2 on hover/press (§6). */
  elevation?: 0 | 1 | 2 | 3;
  pressable?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
};

export function Card({ children, elevation = 1, pressable = false, onClick, style }: CardProps): JSX.Element {
  const theme = useTheme();
  const e = theme.elevation[elevation];

  return (
    <div
      role={pressable ? 'button' : undefined}
      tabIndex={pressable ? 0 : undefined}
      onClick={onClick}
      style={{
        backgroundColor: e.backgroundColor ?? theme.colors.surface1,
        border: e.border ?? 'none',
        boxShadow: e.boxShadow,
        borderRadius: theme.radii.lg,
        padding: theme.spacing[4],
        cursor: pressable ? 'pointer' : undefined,
        transition: pressable ? `box-shadow ${theme.motion.fast} ${theme.motion.easeStandard}` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
