'use client';

import { ThemeProvider } from '@gainly/ui/theme';
import { darkTheme, lightTheme } from '@gainly/ui/tokens';
import { useSyncExternalStore } from 'react';

import { AttributionContent } from './attribution-content';

const QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Dark mode is a requirement, not a toggle (§31). The @gainly/ui components render whichever theme
 * the provider hands them; on web we read the OS preference via useSyncExternalStore — the correct
 * primitive for subscribing to an external store like matchMedia (no setState-in-effect), with an
 * SSR snapshot of light so first paint is deterministic and hydration-safe.
 */
export default function LicensesPage() {
  const isDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <AttributionContent />
    </ThemeProvider>
  );
}
