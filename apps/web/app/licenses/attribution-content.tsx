'use client';

import { Card } from '@gainly/ui/card';
import { useTheme } from '@gainly/ui/theme';
import { Text } from '@gainly/ui/typography';

type LicenseLine = { text: string; href?: string };
type LicenseSection = { id: string; heading: string; body: LicenseLine[] };

/**
 * License sections rendered on the Open Source Licenses page.
 *
 * The exact CC BY-SA wording below is transcribed verbatim from docs/workout-guide-integration.md
 * §6 — do NOT reword it. The 906 Workout Guide images are CC BY-SA 4.0 (copyleft + attribution), so
 * crediting Bryl Lim and Everkinetic and linking the licence is a LEGAL condition of shipping the
 * imagery, not a courtesy, and it is not cut under scope pressure.
 *
 * This is an array on purpose: it is the seam for G-36 (Dwight's software/MIT licence manifest),
 * which appends its own section here once the dependency tree is final — no rewrite of this page.
 * Because it is section-scoped ("Exercise Artwork"), the page never asserts it is the COMPLETE set
 * of licences, so shipping the artwork section alone does not over-promise.
 */
export const LICENSE_SECTIONS: LicenseSection[] = [
  {
    id: 'exercise-artwork',
    heading: 'Exercise Artwork',
    body: [
      { text: 'Exercise artwork © 2026 Bryl Lim (bryllim.com), licensed CC BY-SA 4.0.' },
      {
        text: 'Creative Commons Attribution-ShareAlike 4.0 License',
        href: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
      { text: 'bryllim.com', href: 'https://bryllim.com' },
      { text: 'Certain poses adapted from Everkinetic (github.com/everkinetic/data), CC BY-SA 4.0.' },
      { text: 'github.com/everkinetic/data', href: 'https://github.com/everkinetic/data' },
      {
        text:
          'Artwork was rasterized on a transparent 512 × 512 canvas and recolored for monochrome display. Gainly applies theme tinting at render time only — the shipped frames are unmodified.',
      },
    ],
  },
];

function LicenseLineView({ line }: { line: LicenseLine }) {
  const theme = useTheme();
  if (line.href) {
    return (
      <a href={line.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
        <Text color="primaryStrong">{line.text}</Text>
      </a>
    );
  }
  return (
    <Text color="textSecondary" style={{ color: theme.colors.textSecondary }}>
      {line.text}
    </Text>
  );
}

export function AttributionContent() {
  const theme = useTheme();

  return (
    <main
      style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
        padding: theme.spacing[6],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <Text variant="h1" as="h1">
          Open Source Licenses
        </Text>
        {LICENSE_SECTIONS.map((section) => (
          <Card key={section.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
              <Text variant="h3" as="h2">
                {section.heading}
              </Text>
              {section.body.map((line, i) => (
                <LicenseLineView key={i} line={line} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
