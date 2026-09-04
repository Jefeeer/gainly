import { type JSX, type ReactNode } from 'react';

import { Button } from './button';
import { Text } from './typography';
import { useTheme } from './theme';

export type EmptyStateProps = {
  /** Optional icon/illustration slot (§6) — an icon library is not a dep of this package. */
  icon?: ReactNode;
  title: string;
  message: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

/** Intentional empty state (§84): icon/illustration + h3 headline + body sub + optional CTA. */
export function EmptyState({ icon, title, message, ctaLabel, onCtaPress }: EmptyStateProps): JSX.Element {
  const theme = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[8],
        textAlign: 'center',
      }}
    >
      {icon ? <div aria-hidden="true">{icon}</div> : null}
      <Text variant="h3" as="h3">
        {title}
      </Text>
      <Text variant="body" color="textSecondary">
        {message}
      </Text>
      {ctaLabel ? (
        <div style={{ marginTop: theme.spacing[2] }}>
          <Button variant="primary" label={ctaLabel} onClick={onCtaPress} />
        </div>
      ) : null}
    </div>
  );
}
