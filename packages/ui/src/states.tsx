import { type CSSProperties, type JSX } from 'react';

import { Button } from './button';
import { Text } from './typography';
import { useTheme } from './theme';

/**
 * Loading spinner. Uses an SVG SMIL rotate so it is self-contained (no global @keyframes injection)
 * and renders deterministically under jsdom. Color follows the text-role token it sits beside (§5).
 */
export function Spinner({
  size = 20,
  color,
}: {
  size?: number;
  color?: string;
}): JSX.Element {
  const theme = useTheme();
  const stroke = color ?? theme.colors.textMuted;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="progressbar"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={stroke} strokeWidth="3" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

/**
 * Skeleton placeholder. Pulses via SVG-free CSS animation only when motion is allowed; under
 * reduced motion it holds a static tint instead of pulsing (§4 reduced-motion rule). jsdom has no
 * matchMedia by default, so we treat "no matchMedia" as motion-allowed and let the host decide.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  style,
}: {
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}): JSX.Element {
  const theme = useTheme();
  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.surface2,
        opacity: reduceMotion ? 0.6 : undefined,
        animation: reduceMotion ? undefined : `gainly-skeleton-pulse ${theme.motion.slow} ease-in-out infinite`,
        ...style,
      }}
    />
  );
}

/**
 * Error state (§85): friendly message — never a raw exception string — with a Retry action and an
 * optional secondary Save Locally where the failure was a write.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  onSaveLocally,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  onSaveLocally?: () => void;
}): JSX.Element {
  const theme = useTheme();

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[6],
        textAlign: 'center',
      }}
    >
      <Text variant="h3" as="h3" color="error">
        {title}
      </Text>
      <Text variant="body" color="textSecondary">
        {message}
      </Text>
      <div style={{ display: 'flex', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
        {onRetry ? <Button variant="primary" label="Retry" onClick={onRetry} /> : null}
        {onSaveLocally ? <Button variant="outline" label="Save Locally" onClick={onSaveLocally} /> : null}
      </div>
    </div>
  );
}
