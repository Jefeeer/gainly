// Brings the jest-dom matcher type augmentations (toBeInTheDocument, toHaveStyle, ...) into the tsc
// program. The shared vitest setup imports this at runtime, but tsc needs it in an included file.
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// This vitest config has no `globals`, so @testing-library/react's auto-cleanup (which hooks a
// global afterEach) never registers — unmount explicitly or renders accumulate across tests and
// getByRole finds duplicates.
afterEach(cleanup);

import { Button } from './button';
import { Card } from './card';
import { EmptyState } from './empty-state';
import { Input } from './input';
import { ErrorState, Spinner } from './states';
import { ThemeProvider } from './theme';
import { darkTheme, lightTheme } from './tokens';
import { Text } from './typography';

function renderLight(ui: ReactElement) {
  return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}
function renderDark(ui: ReactElement) {
  return render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);
}

describe('Text', () => {
  it('renders children with the primary text color in light theme', () => {
    renderLight(<Text>Hello</Text>);
    const el = screen.getByText('Hello');
    expect(el).toHaveStyle({ color: '#293034' });
  });
});

describe('Button', () => {
  it('uses a white label on the primary fill in LIGHT theme (5.02:1 AA)', () => {
    renderLight(<Button label="Start Workout" />);
    expect(screen.getByText('Start Workout')).toHaveStyle({ color: '#FFFFFF' });
  });

  it('uses a near-black (bg/base) label on the primary fill in DARK theme — the AA trap', () => {
    renderDark(<Button label="Start Workout" />);
    // White on #4ADE80 fails AA; the dark label must be #0F1211, not #FFFFFF.
    expect(screen.getByText('Start Workout')).toHaveStyle({ color: '#0F1211' });
  });

  it('is disabled and shows a spinner while loading, keeping the label in the DOM for width', () => {
    renderLight(<Button label="Saving" loading />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });

  it('fires onClick when enabled', () => {
    const onClick = vi.fn();
    renderLight(<Button label="Go" onClick={onClick} />);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Input', () => {
  it('renders the label above the field and links it', () => {
    renderLight(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('marks the field invalid and shows the error message when errored', () => {
    renderLight(<Input label="Email" error="Enter a valid email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('uses a stepped surface color (not a shadow) for elevation in dark theme', () => {
    renderDark(<Card>body</Card>);
    // getByText returns the Card div itself (the text is its direct child).
    expect(screen.getByText('body')).toHaveStyle({ backgroundColor: '#171A18' });
  });
});

describe('EmptyState', () => {
  it('renders title, message, and an optional CTA that fires', () => {
    const onCtaPress = vi.fn();
    renderLight(
      <EmptyState title="No Workouts Yet" message="Your progress starts with your first rep." ctaLabel="Start Workout" onCtaPress={onCtaPress} />,
    );
    expect(screen.getByText('No Workouts Yet')).toBeInTheDocument();
    expect(screen.getByText('Your progress starts with your first rep.')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Start Workout' }).click();
    expect(onCtaPress).toHaveBeenCalledOnce();
  });
});

describe('ErrorState', () => {
  it('shows a friendly message with Retry and Save Locally actions', () => {
    const onRetry = vi.fn();
    const onSaveLocally = vi.fn();
    renderLight(<ErrorState message="We couldn't save your workout." onRetry={onRetry} onSaveLocally={onSaveLocally} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText("We couldn't save your workout.")).toBeInTheDocument();
    screen.getByRole('button', { name: 'Retry' }).click();
    screen.getByRole('button', { name: 'Save Locally' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onSaveLocally).toHaveBeenCalledOnce();
  });
});

describe('Spinner', () => {
  it('exposes an accessible progressbar role', () => {
    renderLight(<Spinner />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
