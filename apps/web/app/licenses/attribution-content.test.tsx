// Brings jest-dom matcher types into the tsc program (setup registers them at runtime; tsc needs
// the augmentation in an included file). Same gotcha proven in packages/ui.
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@gainly/ui/theme';
import { darkTheme, lightTheme, type Theme } from '@gainly/ui/tokens';
import { afterEach, describe, expect, it } from 'vitest';

import { AttributionContent, LICENSE_SECTIONS } from './attribution-content';

// No vitest globals in the shared react config, so RTL auto-cleanup never registers — unmount
// explicitly or renders accumulate and getByText finds duplicates.
afterEach(cleanup);

function renderWith(theme: Theme) {
  return render(
    <ThemeProvider theme={theme}>
      <AttributionContent />
    </ThemeProvider>,
  );
}

describe('Open Source Licenses — CC BY-SA attribution (legal requirement)', () => {
  it('credits Bryl Lim with the exact required wording', () => {
    renderWith(lightTheme);
    expect(
      screen.getByText('Exercise artwork © 2026 Bryl Lim (bryllim.com), licensed CC BY-SA 4.0.'),
    ).toBeInTheDocument();
  });

  it('credits Everkinetic for the derived frames', () => {
    renderWith(lightTheme);
    expect(
      screen.getByText('Certain poses adapted from Everkinetic (github.com/everkinetic/data), CC BY-SA 4.0.'),
    ).toBeInTheDocument();
  });

  it('links the canonical CC BY-SA 4.0 licence URL', () => {
    renderWith(lightTheme);
    const link = screen.getByRole('link', { name: /Creative Commons Attribution-ShareAlike 4\.0/ });
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
  });

  it('links both creator/source URLs', () => {
    renderWith(lightTheme);
    expect(screen.getByRole('link', { name: 'bryllim.com' })).toHaveAttribute('href', 'https://bryllim.com');
    expect(screen.getByRole('link', { name: 'github.com/everkinetic/data' })).toHaveAttribute(
      'href',
      'https://github.com/everkinetic/data',
    );
  });

  it('discloses that the frames were adapted (rasterized/recolored)', () => {
    renderWith(lightTheme);
    expect(screen.getByText(/rasterized on a transparent 512 × 512 canvas and recolored/i)).toBeInTheDocument();
  });

  it('renders the same required credits in dark theme (dark mode is a requirement, not a toggle)', () => {
    renderWith(darkTheme);
    expect(
      screen.getByText('Exercise artwork © 2026 Bryl Lim (bryllim.com), licensed CC BY-SA 4.0.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Certain poses adapted from Everkinetic (github.com/everkinetic/data), CC BY-SA 4.0.'),
    ).toBeInTheDocument();
  });

  it('exposes an Exercise Artwork section as an array seam (G-36 appends software licences here)', () => {
    // The page is section-driven so the software-licence manifest is added without a rewrite, and
    // so the page never claims to be the complete licence set.
    expect(LICENSE_SECTIONS.some((s) => s.id === 'exercise-artwork')).toBe(true);
    renderWith(lightTheme);
    expect(screen.getByRole('heading', { level: 2, name: 'Exercise Artwork' })).toBeInTheDocument();
  });
});
