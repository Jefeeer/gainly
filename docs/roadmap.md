# Gainly — Development Roadmap (`roadmap.md`)

Owner: Jan. Covers §103 item 14. Sources: §79 (L2568), §80 (L2750), §81 (L2791), §66 (L2291),
§96 (L3032), §97 (L3050), §100 (L3132). Keyed to the §79 phases. Per-phase loop is fixed by
§103 (L3255): **Plan → Implement → Type Check → Lint → Test → Fix → Review → Continue.**
No placeholder TODOs for core functionality (§103 L3273); no "works" claim without a test
(§103 L3275).

This roadmap is **sequencing + acceptance**, not agent assignment — task decomposition into
agents is god's job (per brief). Each phase lists: goal, docs it depends on, and the evidence
gate that closes it.

---

## Phase 0 — Architecture (this deliverable) ✅ in progress
The 8 docs under `docs/` (Jan) + `workout-guide-integration.md`/`exercise-mapping.md` (Dwight) + design system (Jim) +
testing plan (Angela). **Gate:** schema internally consistent, §81 loop traceable end-to-end
(satisfied in `database.md`/`navigation.md`). Repo scaffold = Darryl.

## Phase 1 — FOUNDATION (§79 L2572)
Monorepo, tsconfig, lint/format, env validation, Supabase client, auth architecture,
navigation shell, design system, **database migrations**, testing infra, exercise
provider/source/asset/alias/muscle/equipment models.
- **Depends on:** `architecture.md`, `database.md`, `rls.md`, `navigation.md`, Jim's design
  system, Dwight's provider abstraction.
- **Owners:** Darryl (scaffold/CI/env), Dwight (provider+source models, migrations),
  Jim (design system), Angela (test infra).
- **Gate:** `supabase db reset` applies all migrations clean; RLS enabled on every table;
  type-check + lint green; seed of muscles/equipment/categories loads (§66).

## Phase 2 — AUTHENTICATION (§79 L2594)
Register, login, logout, OAuth (Google/Apple), password recovery, profile creation, protected
navigation, onboarding (§6).
- **Depends on:** Phase 1; `navigation.md §1` gating; `security.md §3` token storage.
- **Gate:** sign-up → onboarding writes `profiles` + `onboarding_completed_at`; SecureStore
  holds tokens; protected routes reject no-session; auth flow test passes.

## Phase 3 — EXERCISE SYSTEM (§79 L2607) [Dwight-led]
Workout Guide integration, adapter, importer, exercise DB, illustrations/animation, search,
filters, details, favorites, recent, custom exercises, aliases, muscle/equipment mapping,
offline exercise metadata, asset fallback, attribution, integration tests.
- **Depends on:** Phase 1; `database.md §5`, `workout-guide-integration.md`/`exercise-mapping.md` (Dwight, §103 items 6–7).
- **Gate (§79 L2633):** user can search library, filter, view illustration, select, add to a
  workout, complete sets, and later see that exact exercise in history.

## Phase 4 — WORKOUT TRACKING (§79 L2635) — **most important phase (L2651)**
Start/active workout, add exercises, sets + set types, previous performance, rest timers,
workout persistence, finish, summary, history.
- **Depends on:** Phase 3; `database.md §7`, `offline.md`, `api.md §3/§5` (finish+PR), `navigation.md §3`.
- **Gate:** the §81 core loop works offline-resilient (survives kill/restart via `offline.md`);
  finish computes metrics (§17) + detects PRs (§16); previous performance shows on re-entry.
  This is the MVP heart — highest test bar (Angela).

## Phase 5 — TEMPLATES (§79 L2653)
Create/edit/delete/duplicate template; start workout from template; save session as template.
- **Depends on:** Phase 4; `database.md §6`, `api.md` template routes.
- **Gate:** template → start workout prefills exercises/sets; duplicate works.

## Phase 6 — PROGRESS (§79 L2663)
Workout stats, strength charts, PRs, exercise history, volume trends, weekly summaries.
- **Depends on:** Phase 4; `api.md /progress*`, `database.md §11` indexes, §19 ranges.
- **Gate:** strength detail for an exercise shows max wt/e1RM/volume/reps across ranges;
  numbers reconcile with logged sets (correctness).

## Phase 7 — BODY METRICS (§79 L2674)
Weight, body fat, measurements, charts, goals.
- **Depends on:** Phase 1; `database.md §8`, `user_goals`.
- **Gate:** log weight/measurement → chart updates; goal progress computes.

## Phase 8 — NUTRITION (§79 L2684)
Calories, macros, meals, food logging, custom foods, water, nutrition goals.
- **Depends on:** Phase 1; `database.md §8` (meals/food_logs/foods/water), §88 local-date grouping.
- **Gate:** log food to a meal slot → day totals + remaining calories update (feeds Home §8).

## Phase 9 — ADMIN (§79 L2696)
Admin auth, dashboard, exercise management, user management, program management, basic analytics.
- **Depends on:** Phases 1/3; `rls.md` admin policies, `security.md §1`, `admin_audit_logs` (§95).
- **Gate:** admin edits exercise/category with audit-log row written; non-admin denied.

## Phase 10 — NOTIFICATIONS (§79 L2707)
Workout reminders, rest timers, weekly summaries, notification settings.
- **Depends on:** Phase 4; `device_tokens`, `notification_preferences`, `NotificationService` (§93).
- **Gate:** rest-timer local notification fires; preferences gate delivery.

## Phase 11 — HEALTH INTEGRATIONS (§79 L2716)
Apple HealthKit, Android Health Connect, permissions, sync, conflict management.
- **Depends on:** Phases 4/7; `health_connections`, `daily_activity`, `HealthSyncService`.
- **Gate:** least-privilege permission prompt; sync writes activity/weight without duplicating.

## Phase 12 — GAINLY PRO (§79 L2726)
Subscriptions, entitlements, paywall, Pro feature flags.
- **Depends on:** Phase 1; `subscriptions` table, Stripe webhook (`security.md §5`), §94 flags.
- **Gate:** Stripe webhook flips `subscriptions.status`; entitlement gates a Pro feature; store
  compliance for mobile (§43 L1845). **Human gate (Michael): anything touching real billing.**

## Phase 13 — AI COACH (§79 L2735) — last, after core stable (L2737)
Gainly Coach, workout analysis, progress summaries, recommendations, structured context, safety.
- **Depends on:** Phases 4/6/8; `AIService`, §63 AI safety.
- **Gate:** coach reads real user context server-side; safety protections enforced; keys server-only.

---

## MVP cut line (§80)
MVP = **Phases 1–6 + parts of 7/8/9/10** exactly matching §80's list (L2752): auth, onboarding,
profile, exercise DB + WG integration + search + illustrations, templates, workout tracking,
sets/reps/weight, rest timer, history, PRs, summary, strength progress, body weight, basic
calorie+macro, goals, dark mode, notifications, admin exercise management, basic analytics.
**Explicitly deferred (§80 L2779):** social, leaderboards, complex AI, marketplace, advanced
meal planning, wearables, complex programs.

## Seeding (§66, §96, §97) — lands in Phase 1/3
Seed order: muscles → equipment → categories → Workout Guide-imported exercises (normalized,
dedup'd, supplement missing manually — §96 L3038, Dwight) → sample templates (Push/Pull/Legs/
Upper/Lower/Full/Beginner — §97) → dev test data. Migrations are the only schema-change vehicle
(§66 L2293).

---

## §81 MVP success loop = the acceptance spine
The loop (L2795) must "feel excellent before expanding" (§81 L2821). It is realized by the end
of **Phase 4** (tracking) with Phase 3 (exercises) and Phase 6 (progress) completing "see
progress". Traceability to schema+screens is proven in `database.md §MVP` and `navigation.md §5`.

---

## Assumptions & flagged contradictions
- **A1** Phase ordering follows §79 verbatim; MVP cut (§80) spans phases rather than stopping at
  a phase boundary — noted so god sequences the cut correctly.
- **A2** Design system (Phase 1) and testing infra (Phase 1) are owned by Jim/Angela; this
  roadmap references their gates but does not define them (per brief).
- **A3** Billing (Phase 12) and any destructive/prod deploy step are **human gates (Michael)** —
  flagged, not scheduled autonomously.
- **CONTRADICTION C1** (shared): §100/§103 "inspect existing repository" — greenfield; Phase 0
  builds architecture from scratch, Phase 1 creates the repo (Darryl already scaffolding).
