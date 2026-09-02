# GAINLY Design System

Spec source: `GAINLY_MASTER_BUILD_PROMPT.md` §2, §31, §49, §50, §51, §52, §53, §54, §80, §84-86, §92.
Scope: tokens + component contracts only. No components/screens are implemented here — see Boundaries at the end.

## 1. Brand

**GAINLY** — Growth + Fitness + Progress. Personality: strong, modern, premium, motivating, clean, intelligent, athletic, minimal.

Avoid: aggressive bodybuilding aesthetics, excessive gradients, clutter, complex navigation, cartoonish visuals, generic SaaS dashboards.

Target feel: Hevy / Strong / WHOOP / Apple Fitness — not a CRUD admin panel with a green accent slapped on.

Design consequences of the brief:
- Green is a **signal**, not a theme. It marks progress, success, primary action, positive change — never decorative fills, backgrounds, or "brand everywhere" chrome.
- Numbers are a first-class UI element (weight, reps, 1RM, streaks). Metric typography gets its own scale with tabular figures.
- Dark mode is co-equal, not a filter over light mode. Every token below is defined for both from the start.

## 2. Color tokens

Base ramps (raw values — reference by role token, not by ramp name, in product code):

```
green   50 #EAF9EF  100 #CFF2DA  200 #A3E6BB  300 #6FD494  400 #4ADE80  500 #22C55E  600 #16A34A  700 #15803D  800 #166534  900 #14532D
neutral 0  #FFFFFF  50 #F7F8F7  100 #EEF0EE  200 #E4E7E3  300 #C3C9C0  400 #9AA69F  500 #717A71  600 #545C54  700 #4B534D  800 #333933  900 #24282400→ #242824
darksurf base #0F1211  1 #171A18  2 #1F2321  3 #262B27
red     400 #F87171  600 #DC2626  700 #B91C1C
amber   400 #FBBF24  700 #B45309
blue    400 #60A5FA  600 #2563EB  700 #1D4ED8
```

### Role tokens — Light theme

| Token | Value | Used for |
|---|---|---|
| `bg/base` | `#F7F8F7` | Screen background (off-white, not pure white — §51) |
| `bg/surface-1` | `#FFFFFF` | Cards, list rows |
| `bg/surface-2` | `#F0F2EF` | Nested surfaces (input fields, inset panels) |
| `border/default` | `#E4E7E3` | Dividers, card borders |
| `border/strong` | `#C3C9C0` | Input borders, focus-adjacent |
| `text/primary` | `#293034` | Headings, body (sampled from the real logo's ink color, G-7 — see §10) |
| `text/secondary` | `#4B534D` | Supporting text |
| `text/muted` | `#6B746E` | Captions, placeholders, timestamps |
| `primary/default` | `#15803D` | Button fills, active nav, primary CTA |
| `primary/strong` | `#166534` | Pressed state, links on white |
| `primary/subtle` | `#16A34A` | Icons, chart lines, progress fills (non-text graphics) |
| `primary/tint-bg` | `#EAF9EF` | Success banners, selected-chip background |
| `error/default` | `#DC2626` | Error text, destructive fill |
| `warning/default` | `#B45309` | Warning text |
| `info/default` | `#2563EB` | Informational text/links |

### Role tokens — Dark theme

| Token | Value | Used for |
|---|---|---|
| `bg/base` | `#0F1211` | Screen background (near-black, not `#000000` — §31) |
| `bg/surface-1` | `#171A18` | Cards, list rows |
| `bg/surface-2` | `#1F2321` | Nested surfaces, inputs |
| `bg/surface-3` | `#262B27` | Sheets/modals/popovers (top layer) |
| `border/default` | `#333933` | Dividers, card borders |
| `border/strong` | `#4B534D` | Input borders |
| `text/primary` | `#EDEFEC` | Headings, body |
| `text/secondary` | `#C4C9C2` | Supporting text |
| `text/muted` | `#9AA69F` | Captions, placeholders, timestamps |
| `primary/default` | `#4ADE80` | Button fills (label text is `bg/base`, not white), active nav |
| `primary/strong` | `#6FD494` | Pressed state |
| `primary/subtle` | `#4ADE80` | Icons, chart lines, progress fills |
| `primary/tint-bg` | `#153322` | Success banners, selected-chip background |
| `error/default` | `#F87171` | Error text |
| `warning/default` | `#FBBF24` | Warning text |
| `info/default` | `#60A5FA` | Informational text/links |

### Computed contrast ratios (WCAG AA: 4.5:1 text, 3:1 large text/UI components)

| Pair | Ratio | Passes |
|---|---|---|
| `text/primary` on `bg/base` (light) | 12.59:1 | AAA |
| `text/primary` on `surface-1` (light) | 13.40:1 | AAA |
| `text/secondary` on `bg/base` (light) | 7.46:1 | AAA |
| `text/muted` on `bg/base` (light) | 4.54:1 | AA |
| `text/muted` on `surface-1` (light) | 4.83:1 | AA |
| White label on `primary/default` #15803D button | 5.02:1 | AA |
| `primary/subtle` #16A34A vs white (icon/graphic, 3:1 floor) | 3.30:1 | AA (UI component) |
| `primary/strong` #166534 link on white | 7.13:1 | AAA |
| `error/default` on white / white on `error/default` fill | 4.83:1 | AA |
| `warning/default` on white | 5.02:1 | AA |
| `info/default` text on white | 6.70:1 | AAA |
| `text/primary` (dark) on `bg/base` | 16.29:1 | AAA |
| `text/primary` (dark) on `surface-1` | 15.17:1 | AAA |
| `text/secondary` (dark) on `bg/base` | 11.19:1 | AAA |
| `text/muted` (dark) on `bg/base` | 7.47:1 | AAA |
| `text/muted` (dark) on `surface-2` | 6.31:1 | AAA |
| `bg/base` label on `primary/default` #4ADE80 button (dark) | 10.81:1 | AAA |
| `primary/subtle` (dark) on `bg/base` | 10.81:1 | AAA |
| `error/default` (dark) on `bg/base` | 6.81:1 | AAA |
| `warning/default` (dark) on `bg/base` | 11.28:1 | AAA |
| `info/default` (dark) on `bg/base` | 7.41:1 | AAA |

All text and interactive-label pairs clear AA; most clear AAA. `border/default` is decorative (1.17:1 light / 1.59:1 dark) — never carries meaning alone, which matches §49's "not color alone" rule (dividers are reinforced by spacing/elevation, not contrast).

**Dark-mode button rule**: dark-mode CTAs use `bg/base` (near-black) as the label color on a `primary/default` (#4ADE80) fill, not white — white-on-#4ADE80 fails AA (light text on a light-luminance green). This is a real gotcha; flag it in the RN theme so nobody defaults to white button labels in dark mode.

## 3. Typography

Typeface: **Geist Sans** (UI text) + **Geist Mono** (numeric fitness metrics — weight, reps, timers, 1RM). Rationale: distinctive from the default-Inter "generic SaaS dashboard" look the brief explicitly rejects; Mono gives tabular figures so stacked numbers (set rows, PR tables) align without jitter as digits change. Free (SIL OFL), works identically on RN (via `expo-font`) and Next.js (`next/font`).

| Token | Size / Line height | Weight | Use |
|---|---|---|---|
| `type/display` | 40 / 46 | 700 | Onboarding hero, PR celebration |
| `type/h1` | 28 / 34 | 700 | Screen titles |
| `type/h2` | 22 / 28 | 600 | Section headers |
| `type/h3` | 18 / 24 | 600 | Card titles |
| `type/body` | 16 / 24 | 400 | Default body text |
| `type/body-strong` | 16 / 24 | 600 | Emphasized body |
| `type/caption` | 13 / 18 | 400 | Timestamps, helper text |
| `type/label` | 13 / 16 | 600 | Button labels, chip labels, uppercase eyebrow (tracking +0.02em) |
| `type/metric-lg` (mono) | 48 / 52 | 600 | Home hero numbers (streak, today's volume) |
| `type/metric-md` (mono) | 28 / 32 | 600 | Set row weight/reps, chart y-axis peak |
| `type/metric-sm` (mono) | 16 / 20 | 500 | Inline metrics (chip values, table cells) |

Dynamic type: all tokens scale with the OS text-size setting up to at least 130% (RN `allowFontScaling` on, no hardcoded `numberOfLines` that would clip at large sizes on critical screens — workout logger, PR summary). `metric-*` tokens cap scaling at 130% to keep the active-workout set grid from breaking layout; everything else is uncapped.

## 4. Spacing, radii, elevation, motion

**Spacing** — 4px base unit, shared numeral scale (maps 1:1 to Tailwind's default spacing scale on web, same numbers as a plain token object on RN):

`space-1`=4, `space-2`=8, `space-3`=12, `space-4`=16, `space-5`=20, `space-6`=24, `space-8`=32, `space-10`=40, `space-12`=48, `space-16`=64, `space-20`=80

Default screen padding: `space-4` (16px). Card internal padding: `space-4`. Section gap: `space-6`. This is generous by SaaS-dashboard standards on purpose — §51 asks for "generous spacing."

**Radii**: `radius-sm`=8 (chips, inputs), `radius-md`=12 (buttons, small cards), `radius-lg`=16 (cards, sheets), `radius-xl`=24 (hero cards, bottom-sheet top corners), `radius-full`=9999 (avatars, pills, circular progress container).

**Elevation** — light mode uses real shadow; dark mode conveys elevation through surface-color steps (a shadow barely reads on near-black, and a strong one reads as muddy, not premium):

| Token | Light | Dark |
|---|---|---|
| `elevation-0` | none | `bg/base`, no border |
| `elevation-1` (card) | `0 1px 2px rgba(20,24,20,0.06)` | `bg/surface-1` + `1px solid border/default` |
| `elevation-2` (raised card, dropdown) | `0 4px 12px rgba(20,24,20,0.08)` | `bg/surface-2` + `1px solid border/default` |
| `elevation-3` (modal, sheet) | `0 12px 32px rgba(20,24,20,0.12)` | `bg/surface-3` + `1px solid border/strong` |

**Motion** — durations tuned short; this is a workout logger, not a marketing site, so nothing should make the user wait between taps (§53: minimal taps).

| Token | Value | Use |
|---|---|---|
| `motion/instant` | 100ms | Checkbox/set-complete tick, toggle |
| `motion/fast` | 160ms | Button press, chip select |
| `motion/base` | 220ms | Screen transitions, tab switch |
| `motion/slow` | 320ms | Bottom sheet / modal enter-exit |
| `ease/standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default — decelerate in, no bounce |
| `ease/entrance` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering (sheet up, toast in) |
| `ease/exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |

Reduced motion (§49): when `AccessibilityInfo.isReduceMotionEnabled()` (RN) / `prefers-reduced-motion` (web) is set, collapse all `motion/*` durations to 0 and drop transform-based entrances to opacity-only. The rest timer's countdown ring animation is exempt — it's the *content*, not decoration, but its sweep easing switches to linear (no bounce) under reduced motion.

## 5. Icons

`lucide-react-native` (mobile) / `lucide-react` (web/admin) — one icon source, outline style at 1.5px-2px stroke, matches "clean, minimal, athletic" and stays legible at small sizes (nav bar, set-row actions). Default sizes: `icon-sm`=16, `icon-md`=20, `icon-lg`=24, `icon-xl`=32. Icon color always follows the text-role token it sits beside (never a hardcoded hex) so it inherits contrast guarantees automatically.

## 6. Component inventory (MVP surface, §80)

Contract = purpose, key variants/states, a11y notes. No implementation here — Darryl/whoever builds `packages/ui` owns the actual code once the monorepo scaffold and Jan's nav map land.

**Primitives**
- `Button` — variants: `primary` (fill), `secondary` (tinted bg), `outline`, `ghost`, `destructive`. Sizes: `sm`/`md`/`lg`. States: default/pressed/disabled/loading (inline spinner replaces label, keeps width). Min hit target 44×44 regardless of visual size (§49).
- `IconButton` — same state set as Button, 44×44 minimum touch target, requires `accessibilityLabel`/`aria-label` (icon-only, no visible text).
- `Card` — `elevation-1` default, optional `pressable` variant (adds `elevation-2` on press + `motion/fast` scale-down to 0.98).
- `Input` / `Select` — label above field (never placeholder-as-label — fails §49 for screen readers once text is entered), error state shows message below in `error/default` text *and* a leading icon (not color alone), focus ring = 2px `primary/subtle` outset.
- `Badge`, `Chip` — status/filter tags; selected state uses `primary/tint-bg` + `primary/strong` text, never fill-only (needs the text contrast, not just a color swap).
- `Avatar` — circular, `radius-full`, fallback = initials on `bg/surface-2`.
- `Tabs` — underline indicator in `primary/default`, animates position with `motion/base`/`ease/standard`.
- `Modal`, `BottomSheet` — `elevation-3`, `radius-xl` top corners on sheet, backdrop `rgba(0,0,0,0.4)` both themes (backdrop is the one place a flat black is fine — it's not a surface, it's a scrim), enter/exit via `motion/slow`.
- `Toast` — auto-dismiss 4s, always includes a dismiss action for screen-reader users (no reliance on the timeout), `role="status"`/`accessibilityLiveRegion="polite"`.
- `ProgressBar`, `CircularProgress` — value conveyed by fill *and* a numeric label (never bar length alone) — used for rest timer ring, goal completion.
- `Skeleton` — pulse animation `motion/base`, respects reduced-motion (fades instead of pulsing).

**Product components**
- `MetricCard` / `StatCard` — `type/metric-md` value + `type/caption` label + optional trend chip (▲/▼ glyph, never color-only for direction).
- `ExerciseIllustration` — fixed 1:1 container, skeleton placeholder while loading, fallback silhouette icon if a frame is missing (never a broken-image state). Source is the `@bryllim/workout-guide` package: exactly 3 raster PNG frames per exercise (512x512, `assets/<slug>/frame-{1,2,3}.png`, shipped in-package — no CDN fetch/cache layer needed for offline). The "exercise animation" is a fixed 3-frame cycle, not an arbitrary sprite count or a vector morph — build the loading/placeholder state around exactly 3 raster frames.
  **Legal constraint, binding**: all 906 frames are CC BY-SA 4.0 (ShareAlike). The component must render the shipped frame **verbatim** and apply theme/dark-mode tinting at render time only — `tintColor` on `expo-image` (mobile), CSS `filter` (web). Never pre-bake a recolored/themed copy of a Workout Guide frame into the repo as a build asset; a modified image we ship would itself have to stay CC BY-SA 4.0. If a build step ever transforms a WG frame, that's the line — stop.
  Also render an `isStretch` badge/chip variant (14 of 302 exercises) using the existing `Badge`/`Chip` primitive, not a new component.
- `ExerciseCard` — illustration + name + last-performed metric, tap target is the full card row (not just the text). Slugs do not encode equipment (`bench-press`, not `barbell-bench-press`) — do not derive equipment display from the slug.
- `ExerciseDetail` empty state — `instructions`/`description`/`difficulty` do not exist in the imported package (Gainly-owned content, empty until authored). This is a real, designed MVP empty state on the exercise-detail screen (reuse `EmptyState`), not a "will be populated" placeholder assumption.
- `SetRow` (active-workout set logger — the highest-traffic component in the app) — columns: set #, previous (muted, mono), weight input, reps input, complete-toggle. Complete toggle is a full-row tap target (not a tiny checkbox), fires optimistic update (§83), haptic + `motion/instant` check animation on completion. Each input needs `accessibilityLabel` that includes the set number and field ("Set 2 weight") since visually the label is implied by column position only — a screen reader flattens the grid.
- `RestTimer` — `CircularProgress` ring + `type/metric-lg` countdown + skip/add-15s actions below (44×44 targets), announces "Rest complete" via live region on end so a screen-reader user doesn't have to watch the ring.
- `ChartShell` — wraps the chart lib pick (see §7) with a consistent header (title + time-range selector), and *owns* the empty/loading/error states so no screen implements its own chart-empty-state copy.
- `EmptyState` — icon/illustration + `type/h3` headline + `type/body` sub + optional CTA button. Copy per §84 (e.g. "No Workouts Yet" / "Your progress starts with your first rep." / **Start Workout**).
- `ErrorState` — icon + friendly message (never a raw exception string, §85) + `Retry` action + secondary `Save Locally` action where the error is a failed write.

## 7. Dependency picks (Darryl installs — not installed here)

- **Charts (mobile, §54)**: `react-native-gifted-charts`. It covers line/bar/donut with tooltips, time-range windows, and animated reveals without pulling in a Skia native dependency (Victory Native XL requires `react-native-skia`, which adds Expo config-plugin and build complexity we don't need for MVP line/bar/donut charts). Revisit Victory Native XL only if a future chart needs custom Skia-level rendering gifted-charts can't do.
- **Charts (web/admin dashboard)**: `recharts`. Standard React charting, no RN constraint on web, matches Tailwind theming easily. Web is explicitly allowed to diverge per §4 — no need to force one chart lib across both platforms.
- **Icons**: `lucide-react-native` + `lucide-react` — one visual language, tree-shakeable, already the de-facto pick alongside Tailwind/shadcn-style stacks for the web admin.
- **Animation**: `react-native-reanimated` (near-default with Expo already, needed for the rest-timer ring, set-complete micro-interactions, sheet transitions) on mobile; `framer-motion` on web (marketing/onboarding only — admin dashboard needs minimal motion).
- **Fonts**: Geist Sans + Geist Mono via `expo-font` (mobile) and `next/font` (web) — see §3.

## 8. Mobile/web sharing boundary (§4 L248)

**Shared (`packages/ui` or `packages/config`, plain data/types, no rendering):**
- Token values from this doc (color roles, type scale, spacing, radii, elevation, motion) as a single TS object, imported both by the RN theme provider and by `tailwind.config.ts` on web, so a token only ever has one source of truth.
- Shared TS types for token names (so RN and web autocomplete the same role names) and Zod schemas for anything user-configurable (theme preference, etc.) already covered by `packages/validation`.

**Not shared — native per platform, per the brief's explicit instruction not to force it:**
- Actual rendered components (`Button`, `BottomSheet`, `Modal`, `SetRow`, charts). RN's gesture/keyboard/sheet model and a desktop mouse-driven admin dashboard don't converge into one component without compromising one side — the brief calls this out directly (§4).
- The active-workout logger, rest timer, and any touch-first interaction pattern are mobile-only builds; the web app's role (marketing + auth + user dashboard + admin, §3) is read/manage-oriented, not a rebuild of the workout logger.

Net effect: change a token once, both platforms pick it up automatically; component behavior stays free to diverge without token drift.

## 9. Brand gradient (graphics-only — do not use for text or small UI)

The logo's green is a two-stop gradient sampled directly from `Gainly-logo.png` pixels (script in §10), not a flat color:

```
gradient-dark-stop:  #1AAE2C
gradient-light-stop: #A3E00B
angle:                40deg
css: linear-gradient(40deg, #1AAE2C 0%, #A3E00B 100%)
```

**This gradient fails accessibility and must never be used for text, icons, or small interactive fills**: `#1AAE2C` on white is 2.94:1 and `#A3E00B` on white is 1.59:1 — both fail even the 3:1 UI-component floor, let alone 4.5:1 text. (On dark backgrounds they fare better — 6.40:1 and 11.86:1 — but the rule stays universal so nobody has to remember a background-dependent exception.)

That's exactly why `primary/default`/`primary/subtle` in §2 are separate, deliberately-chosen accessible greens (`#15803D`/`#16A34A` light, `#4ADE80` dark) — they are the **only** greens allowed in text, buttons, links, icons, charts, and focus rings. The sampled gradient above is reserved for the logo mark itself and large decorative graphics (hero illustrations, splash art) where no text sits directly on it and no meaning is conveyed by the color alone.

## 10. Logo (G-7 — sourced from `Gainly-logo.png`)

The human-supplied logo is a lockup: a circular "G" mark (charcoal ring + dumbbell flanks + the green gradient arrow/bar-chart) stacked above the "GAINLY" wordmark, on an opaque white canvas (1254x1254, no alpha).

**Pipeline**: `gainly/scripts/generate-brand-assets.mjs` (re-run via `cd gainly/scripts && npm install && npm run brand-assets` whenever the source logo changes). It samples the palette from real pixels (not eyeballed), keys out the white background with anti-alias-aware matte decontamination (edge pixels are recolored to their nearest solid neighbor before alpha is computed, so there's no white fringing), splits the mark from the wordmark via row-density gap detection, and renders every derivative below into `packages/ui/assets/brand/`. Tooling added: `sharp` as a `devDependency` of a standalone `gainly/scripts/package.json` (plain `npm install`, isolated from the pnpm workspace root — does not touch root `package.json`/`pnpm-workspace.yaml`/`turbo.json` or the pnpm lockfile).

**Files produced** (`packages/ui/assets/brand/`):

| File | Purpose |
|---|---|
| `mark-transparent.png` | Mark only, tight crop + 12% optical padding, transparent — for light surfaces |
| `mark-dark-bg.png` | Same crop, charcoal swapped for `#EDEFEC` — for placing directly on dark surfaces |
| `lockup-stacked-transparent.png` / `-dark-bg.png` | Full mark+wordmark, original stacked layout, tight crop, transparent |
| `lockup-horizontal-transparent.png` / `-dark-bg.png` | Full lockup recomposed mark-left/wordmark-right, for wide placements (web header) |
| `app-icon-ios-1024.png` | 1024x1024, **opaque**, no alpha channel (App Store requirement), dark-bg-token background, mark at 70% width |
| `android-adaptive-foreground-432.png` + `android-adaptive-background-432.png` | Adaptive icon layers (432px = 108dp@4x), foreground mark within the 66% safe-zone diameter, recolored light since it composites over the dark background layer |
| `splash-mark-light-1200.png` / `splash-mark-dark-1200.png` | Transparent mark for Expo splash `resizeMode: contain`, paired with a light or dark `splash.backgroundColor` per system theme |
| `favicon-16/32/48.png`, `apple-touch-icon-180.png` | Mark-only, from the same tight crop |
| `manifest.json` | Machine-readable palette + contrast report + file list, for whoever wires app/web config next |

**Wiring left for the scaffold owner** (not done here per task boundary): `app.json`/`expo` icon + adaptive-icon + splash config keys, Next.js `app/icon.png`/`app/apple-icon.png` file-convention (simpler and more reliable than hand-building a multi-res `.ico` — no ico-encoding dependency needed), and `favicon.ico` replacement in `apps/web/app/`.

### Logo usage rules

- **Minimum sizes**: mark alone ≥ 24px. Full lockup (either orientation) ≥ 120px wide — below that the wordmark stroke width and letter spacing degrade. Never scale the wordmark below this and expect it to stay legible; use the mark alone instead.
- **Clear space**: keep clear space around the lockup ≥ the height of the dumbbell flanks on each side (roughly 12% of the mark's width, matching the padding baked into `mark-transparent.png`).
- **Which variant on which background**: light/off-white and `bg/surface-*` (light theme) → natural-color variants (`*-transparent.png`). Any `bg/base`/`bg/surface-*` (dark theme) or other dark fill → the `*-dark-bg.png` variants. Never place the natural-color mark on a dark surface — the charcoal ring contrast is 1.41:1 there (invisible) which is exactly the defect this pipeline exists to avoid.
- **Do not**: recolor the green gradient (it's sampled from the real asset, not a design choice to tweak); stretch or skew any variant (all compositing here preserves aspect ratio); recreate the wordmark in a different typeface for "consistency" with Geist — the wordmark is part of the fixed brand asset, not typeset UI text; or pre-bake any further edited copies outside this script (re-run the script instead, so the pipeline stays the single source of truth).

## 11. Needs human sign-off

- ~~No wordmark/logo file exists yet~~ — resolved by G-7: the real logo landed and brand palette/derivative assets are now sourced from it (see §10, `packages/ui/assets/brand/`).
- ~~No exercise illustration set exists yet~~ — resolved: `@bryllim/workout-guide` supplies 906 verified frames. `ExerciseIllustration`'s contract above reflects the real 3-frame/render-time-tint/CC BY-SA constraints. An attribution screen (Settings > About > Open Source Licenses) is confirmed MVP scope (G-12) but is a separate dispatched task, not built here.
- Whether the mark reads cleanly at true favicon scale (16px) is worth a human eyeball check — it's a dense mark (ring + dumbbell flanks + arrow) being asked to do icon-at-16px duty; the pipeline crops it correctly but can't judge legibility taste. Files are in `packages/ui/assets/brand/favicon-16.png` / `favicon-32.png` if a look is wanted.
