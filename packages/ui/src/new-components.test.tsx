import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Badge } from './badge';
import { IconButton } from './icon-button';
import { MetricCard } from './metric-card';
import { ProgressBar } from './progress-bar';
import { ThemeProvider } from './theme';
import { darkTheme, lightTheme } from './tokens';

function renderLight(ui: React.ReactNode) {
  return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}
function renderDark(ui: React.ReactNode) {
  return render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);
}

afterEach(cleanup);

describe('IconButton', () => {
  it('renders with an accessible label', () => {
    renderLight(<IconButton aria-label="Delete set" icon={<span>×</span>} />);
    expect(screen.getByRole('button', { name: 'Delete set' })).toBeInTheDocument();
  });

  it('has minimum 44px touch target', () => {
    renderLight(<IconButton aria-label="Add" icon={<span>+</span>} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ width: '44px', height: '44px' });
  });

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderLight(<IconButton aria-label="Toggle" icon={<span>⟳</span>} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    renderLight(<IconButton aria-label="Locked" icon={<span>🔒</span>} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Badge', () => {
  it('renders text content', () => {
    renderLight(<Badge>Beginner</Badge>);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('renders as a button when onPress is provided', () => {
    const onPress = vi.fn();
    renderLight(<Badge onPress={onPress}>Filter</Badge>);
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
  });

  it('indicates selected state via aria-pressed', () => {
    const onPress = vi.fn();
    renderLight(<Badge onPress={onPress} selected>Active</Badge>);
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onPress when clicked', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    renderLight(<Badge onPress={onPress}>Tap me</Badge>);
    await user.click(screen.getByRole('button', { name: 'Tap me' }));
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe('ProgressBar', () => {
  it('renders a progressbar with the correct percentage', () => {
    renderLight(<ProgressBar value={0.75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
  });

  it('displays the percentage text', () => {
    renderLight(<ProgressBar value={0.5} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays an optional label', () => {
    renderLight(<ProgressBar value={0.6} label="Calories" />);
    expect(screen.getByText('Calories')).toBeInTheDocument();
  });

  it('clamps value above 1 to 100%', () => {
    renderLight(<ProgressBar value={1.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps negative value to 0%', () => {
    renderLight(<ProgressBar value={-0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('hides value text when showValue is false', () => {
    renderLight(<ProgressBar value={0.5} showValue={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });
});

describe('MetricCard', () => {
  it('renders the metric value and label', () => {
    renderLight(<MetricCard value="82.5 kg" label="Bench Press" />);
    expect(screen.getByText('82.5 kg')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('renders trend direction glyph', () => {
    renderLight(
      <MetricCard
        value="100 kg"
        label="Deadlift"
        trend={{ direction: 'up', value: '+5 kg' }}
      />,
    );
    expect(screen.getByText('▲')).toBeInTheDocument();
    expect(screen.getByText('+5 kg')).toBeInTheDocument();
  });

  it('renders down trend glyph', () => {
    renderLight(
      <MetricCard
        value="75 kg"
        label="Squat"
        trend={{ direction: 'down' }}
      />,
    );
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('is pressable when onClick is provided', () => {
    const onClick = vi.fn();
    renderLight(<MetricCard value="12" label="Workouts" onClick={onClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
