import { createContext, useContext, type JSX, type ReactNode } from 'react';

import { lightTheme, type Theme } from './tokens';

/**
 * Both themes are defined together in tokens.ts; the provider picks one for a subtree and every
 * component reads the resolved theme via useTheme(). This is the one place "which theme" is decided
 * on web — retrofitting dark later is how palettes break (§31), so dark is co-equal from the start.
 */
const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}): JSX.Element {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
