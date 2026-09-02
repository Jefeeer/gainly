# Gainly — Mobile Navigation & Screen Inventory (`navigation.md`)

Owner: Jan. Covers §103 items 8–9. Sources: §6 (L301), §7 (L376), §8 (L394), §9 (L451),
§18 (L1333), §29 (L1536), §30 (L1557), §98 (L3072). RN + **Expo Router** (§3 L102) — file-based
routing. Design visuals = Jim (design-system).

---

## 1. Navigation architecture (Expo Router)

Three route groups gate on auth/onboarding state at the root layout:

```text
app/
  _layout.tsx                 # root: reads session; routes to (auth) | (onboarding) | (tabs)
  (auth)/                     # unauthenticated stack (§6 screen1, §2 auth)
    welcome.tsx               #   Welcome — Get Started / Sign In (§6 L309)
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  (onboarding)/               # authed but onboarding_completed_at is null (§6)
    goal.tsx                  #   Screen 2 — Fitness Goal (§6 L319)
    experience.tsx            #   Screen 3 — Experience Level (§6 L330)
    personal-info.tsx         #   Screen 4 — DOB/height/weight/sex/units (§6 L336)
    frequency.tsx             #   Screen 5 — Training frequency 1–7 (§6 L351)
    nutrition-goal.tsx        #   Screen 6 — optional (§6 L359)
    first-launch.tsx          #   §98 — "Ready for your first workout?" (Start / Choose Template)
  (tabs)/                     # authenticated app — 5 primary tabs (§7 L378)
    _layout.tsx               #   Tab bar; Workout center + prominent (§7 L386)
    index.tsx                 #   HOME (§8)
    workout/                  #   WORKOUT (stack)
    progress/                 #   PROGRESS (stack)
    nutrition/                #   NUTRITION (stack)
    profile/                  #   PROFILE (stack)
  workout/active.tsx          # modal/full-screen active-workout route (see §3)
  modals/                     # global modals (exercise picker, rest timer, log sheets)
```

**Auth/onboarding gating** is done once in `app/_layout.tsx`: no session → `(auth)`; session
but `onboarding_completed_at is null` → `(onboarding)`; else `(tabs)` (§6, protected navigation
§79 Phase 2 L2604).

---

## 2. The 5 primary tabs (§7 — "approximately five")

`Home · Workout · Progress · Nutrition · Profile`. **Workout is visually prominent** (center,
elevated FAB-style, §7 L386). Secondary features are reached from within sections, not new tabs
(§7 L390).

---

## 3. Active-workout as a special route (§9, §39)

The active workout (§9) is a **full-screen route outside the tab stack** (`workout/active`),
backed by Zustand + local persistence (§37, `offline.md`) so it survives backgrounding, app
close, and connectivity loss (§39 L1775). A persistent "resume workout" banner appears on Home
and the Workout tab while a session is active. Rest timer (§12) is a global overlay/modal that
floats above any screen and can fire a local notification (§12 L559).

---

## 4. Screen inventory (§103 item 9)

### (auth)
| Screen | Purpose | Key data |
|---|---|---|
| Welcome | entry, Get Started / Sign In (§6 L309) | — |
| Sign In / Sign Up | email+password, Google, Apple (§2 auth) | Supabase Auth |
| Forgot Password | magic link / reset (§79 P2) | — |

### (onboarding) — §6 screens 2–7 + §98
Goal · Experience · Personal Info · Training Frequency · Nutrition Goal · First Launch.
Writes to `profiles` (+`nutrition_goals`) on completion → sets `onboarding_completed_at`.

### Home tab (§8)
| Screen | Content |
|---|---|
| Home Dashboard | greeting, date, streak, today's workout, calories consumed/remaining, current weight, weekly progress, latest PR, quick actions (Start Workout / Log Weight / Log Food / Add Water) — §8 L400. Cards + progressive disclosure (§8 L447). |

### Workout tab (§9, §14, §15)
| Screen | Content |
|---|---|
| Workout Home | Start empty · Start from template · Resume · Templates · Programs |
| Template List / Detail / Edit | §14 CRUD, duplicate |
| Program List / Detail | §15 schedule view |
| **Active Workout** (full-screen route) | add/remove/reorder exercises, sets, set types, previous performance, rest timer, notes, replace, finish (§9 L455) |
| Exercise Picker (modal) | search + filter + favorites + recent (§13, §58, §59, §60) [illustrations → dwight] |
| Exercise Details (modal) | instructions, muscles, illustration/demo (§13A [→ dwight]) |
| Workout Summary | duration, sets, volume, PRs, per-exercise recap (§56, §17) |

### Progress tab (§18, §19, §20)
| Screen | Content |
|---|---|
| Progress Overview | §18 sections: Overview · Strength · Body · Activity · PRs · Measurements |
| Strength Detail | pick exercise → max wt / e1RM / volume / max reps; ranges 1m/3m/6m/1y/all (§19) |
| Personal Records | §16 list |
| Body & Measurements | weight + measurement charts (§20) |
| Activity | steps/active cal/distance/minutes (§26) |

### Nutrition tab (§22–25)
| Screen | Content |
|---|---|
| Nutrition Day | day totals (cal/macros/water), meals Breakfast/Lunch/Dinner/Snacks (§23) |
| Food Search / Add | catalog + custom foods (§23) |
| Water | quick 250/500/750/custom (§24) |
| Nutrition Goals | calorie + macro goals (§25) |

### Profile tab (§29, §30)
| Screen | Content |
|---|---|
| Profile | avatar, name, goal, level, height/weight, units, frequency, subscription, connected services (§29) |
| Settings | Account · Units · Notifications · Privacy · Connected Apps · Theme · Subscription · Help · About · Logout · Delete Account (§30) |
| Settings > About > Open Source Licenses | **MVP scope, not future (G-12, human-ratified).** Credits Bryl Lim + Everkinetic for the 906 exercise illustrations (76 Everkinetic-derived), and surfaces CC BY-SA 4.0 terms for the imagery alongside MIT for the code — legal requirement per the WG image-licensing ruling, does not get cut under scope pressure. Content sourced from Dwight's `workout-guide-integration.md` compliance checklist (authoritative). Design = Jim; do not build ahead of his spec. |
| Goals | fitness goals CRUD (§21) |
| Subscription / Paywall | Free / Pro (§43) — post-MVP entitlement gate |

---

## 5. §81 MVP loop over this map (DONE gate)
Install → `(auth)/welcome` → Sign Up → `(onboarding)` (goal…frequency) →
`(onboarding)/first-launch` (§98) → Workout Home → **Active Workout** → Exercise Picker
(search/select) → log sets → Finish → Workout Summary → later: Home shows streak/last PR;
Active Workout shows **previous performance** (§9 L476) → increase weight → Progress → Strength
Detail shows the gain. **Every step in §81 (L2795) is a reachable screen above.**

---

## 6. Component-inventory alignment

Every screen in §4 composes primitives from Jim's `design-system.md` component inventory — this
doc names *screens and routes*, not components; Jim's doc names *components*, not screens. Where
a screen needs a component that doesn't yet exist in `design-system.md` (e.g. the exercise
illustration component with render-time tinting, or an Open Source Licenses list item), that is a
gap in his inventory to flag, not a reason to invent an ad-hoc one-off component here. Screens
composing existing primitives is the default; a new named component only gets added when no
existing one fits — same ownership boundary as `A2`/`A3` below.

## Assumptions & flagged contradictions
- **A1** §7 says "approximately five" tabs — adopted exactly 5 (Home/Workout/Progress/
  Nutrition/Profile). Goals/Subscription live under Profile, not as tabs (§7 L390).
- **A2** Active workout modeled as a full-screen route outside tabs (not a tab) so the rest
  timer/persistence overlay behavior (§12, §39) works from anywhere. Design treatment = Jim.
- **A3** Exercise picker/details screens are listed but their illustration/animation behavior
  is Dwight's (§13A). Referenced, not specified here.
- **A4 Component alignment.** Every screen above composes only components in Jim's
  `design-system.md §6` inventory (`SetRow`, `RestTimer`, `ExerciseCard`, `ExerciseIllustration`,
  `MetricCard`, `ChartShell`, `EmptyState`, `ErrorState`, `Card`, `BottomSheet`, etc.) — no screen
  references a component nobody specified. `ExerciseIllustration` renders WG frames **verbatim
  with render-time tint** (no pre-baked recolour — CC BY-SA ShareAlike, god-ratified). The
  Exercise Picker/Details modals and Active-Workout logger map to those contracts.
- No navigation-specific contradictions beyond the shared greenfield note (C1).
