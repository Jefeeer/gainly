# Gainly — Architecture & Repository Structure (`architecture.md`)

Owner: Jan. Covers §103 items 1–2 (+9 feature modules). Sources: §3 (L91), §4 (L202),
§5 (L252), §37 (L1721), §38 (L1739), §91 (L2942), §92 (L2962), §93 (L2983), §94 (L3004),
§102 (L3173). Priority order §101: correctness > data integrity > security > UX.

---

## 1. System shape

Gainly is a **Turborepo monorepo** (§4) with four apps over a shared Supabase Postgres
backend. One canonical data model; platform-specific UIs.

```text
                 ┌───────────────────────────────────────────────┐
   mobile (RN/Expo)  ──┐                                          │
   web (Next.js)       ├── @gainly/validation (Zod, shared) ──────┤
   admin (Next.js)     │   @gainly/types  @gainly/constants       │
   api (Node/TS)  ─────┘   @gainly/utils  @gainly/analytics       │
        │                                                          │
        │  Supabase JS (anon key + user JWT)                       │
        ▼                                                          ▼
   Supabase: Postgres + RLS + Auth + Storage + Edge Functions
        ▲
        │  service-role key (SERVER ONLY — §34 L1671, §46)
   api (Node): Stripe webhooks, push orchestration, health sync,
               scheduled jobs, analytics aggregation, AI (§3 L138)
```

**Trust boundary:** clients (mobile/web) talk to Supabase directly with the user's JWT; RLS
(`rls.md`) is the primary authorization layer. Anything that must not run on a client — the
service-role key, Stripe secrets, cross-user aggregation, AI keys — lives in `apps/api` (§3
L138, §46). The service-role key is **never** shipped to a client (§34 L1673).

---

## 2. Repository structure

Follows §4's tree (L208) exactly — Darryl owns the scaffold; this documents intent, not new
files.

```text
gainly/
  apps/
    mobile/    # React Native + Expo Router; primary product (§3, §7)
    web/       # Next.js marketing + auth + user web dashboard (§3 L122)
    admin/     # Next.js admin portal (§40) — separate app (§40 L1786)
    api/       # Node/TS service layer + Supabase Edge Function handlers (§3 L129)
  packages/
    ui/          # shared primitives; platform-split where UX demands (§4 L248)
    database/    # generated Supabase types + typed query helpers + migration client
    types/       # domain TS types shared by all apps (§4 L240)
    validation/  # Zod schemas — single source of truth (§36 L1701)
    config/      # shared tsconfig/eslint/tailwind presets (Darryl owns contents)
    analytics/   # PostHog event catalog + typed emit() (§44)
    utils/       # date/unit conversion, formatters (§88, §89)
    constants/   # muscle/equipment/enum labels, rest presets (§12, §13)
    exercises/   # Workout Guide adapter + import — [→ dwight] (§13A, §103 items 6–7)
  supabase/
    migrations/  # every schema change (§66 L2293)
    functions/   # Edge Functions (§3 L136)
    seed/        # muscles, equipment, categories, WG exercises, sample templates (§66, §96, §97)
  scripts/
    import-workout-guide.ts   # [→ dwight]
  docs/          # THIS deliverable (Jan owns)
```

### Why monorepo (rationale, §4 L238)
Mobile, web, admin, and api must agree byte-for-byte on domain types, Zod validation, enum
labels, and analytics event names. A monorepo makes `@gainly/validation` and `@gainly/types`
the single source of truth imported everywhere, so a schema change is one edit that
type-breaks every consumer at compile time (correctness §101 #1). Turborepo gives cached,
dependency-aware builds so CI only rebuilds affected packages.

### Sharing policy
Share **logic** aggressively (types, validation, constants, analytics, utils). Do **not** force
shared UI between mobile and web (§4 L248) — `apps/mobile` uses RN primitives, `apps/web`/admin
use Tailwind/DOM. `packages/ui` holds only genuinely portable primitives (tokens, icons).

---

## 3. Feature-module boundaries (§92 L2962, §93)

Each app organizes by **feature**, not by layer (§92 L2964):

```text
features/<domain>/{ api, components, hooks, screens, schemas, services, types, utils }
```

Domains (map 1:1 to §93 services and the DB clusters in `database.md`):

| Feature module | Owns (tables) | Backend service (§93) |
|---|---|---|
| `auth` | profiles (identity) | — (Supabase Auth) |
| `onboarding` | profiles (goal/level/units) | — |
| `exercises` | exercises, aliases, muscles, equipment, favorites | ExerciseService |
| `workouts` | sessions, session_exercises, sets | WorkoutService |
| `records` | personal_records | PersonalRecordService |
| `templates` | workout_templates(+exercises) | WorkoutService |
| `programs` | programs, weeks, days, workouts | WorkoutService |
| `progress` | (reads sessions/sets/PRs/weight) | — (read models) |
| `body` | body_measurements, weight_logs | — |
| `nutrition` | meals, food_logs, foods, water_logs, nutrition_goals | NutritionService |
| `goals` | user_goals | GoalService |
| `activity` | daily_activity, health_connections | HealthSyncService |
| `subscriptions` | subscriptions | SubscriptionService |
| `notifications` | notification_preferences, device_tokens | NotificationService |
| `admin` | (cross-cutting) + admin_audit_logs | — |
| `ai` | (reads all; future) | AIService |

**Business logic lives outside UI** (§91 L2950): services in `apps/api` and `features/*/services`
are independently testable (§93 L3000). UI components stay small/composable (§92).

---

## 4. State management contract (§37, §38)

- **Server state → TanStack Query** (§38): workouts, exercises, progress, nutrition, profile,
  templates, programs, goals. Owns caching, invalidation, optimistic updates, retries, offline
  (see `offline.md`).
- **Local/ephemeral state → Zustand** (§37): active workout, rest timer, draft workout, UI
  prefs, temporary filters. **Server state must not live in Zustand** (§37 L1733) — the one
  exception is the *active workout draft*, which is deliberately local-first for offline
  resilience (§39) and reconciled to the server on finish (`offline.md`).

---

## 5. Feature flags (§94)
`packages/constants` exports flag keys (`nutrition`, `health_sync`, `ai_coach`, `gainly_pro`,
`social`, `programs`); resolution is a simple server-config table or env-driven map read at
app start. MVP ships `nutrition`, `programs` on; `ai_coach`, `social`, `health_sync` off. No
speculative flag service — a keyed record is enough (ponytail: upgrade to a provider only if
per-user targeting is needed).

---

## 6. Objection to §4's given tree (per brief — none material)

The §4 tree (L208) is sound and adopted **as-is**. Two non-blocking notes (not restructurings):
- `packages/database` should hold the **generated** Supabase types so `@gainly/types` stays
  hand-authored domain types — keeps generated vs authored separate. This is an internal
  convention, not a tree change.
- `apps/api` doubles as both the Node service host and the home for Edge Function *source*
  before deploy to `supabase/functions`. If Darryl prefers Edge sources only under
  `supabase/functions`, that's compatible. Flagged for Darryl, not changed here.

No objection requiring escalation. The tree stands.

---

## 7. How this satisfies §102 (unified "PROGRESS" product)
The home dashboard (§8) is a **read-model** feature that composes across modules (streak from
sessions, calories from food_logs, weight from weight_logs, PR from personal_records, weekly
count from sessions). Because all modules share one Postgres schema and one type/validation
package, the dashboard's four questions ("what I did / where I am / where I'm going / what
next", §102 L3215) are single-query joins, not cross-service stitching — that is what makes
Gainly feel like one app, not several tools (§102 L3209).

---

## Assumptions & flagged contradictions
- **A1** `apps/web` includes a "user web dashboard where appropriate" (§3 L126) — treated as
  post-MVP; MVP web = marketing + auth only. Mobile is the product.
- **A2** Edge Functions vs `apps/api` Node: both exist per §3. Rule adopted — latency-sensitive
  DB-adjacent logic → Edge Function; long-running/secret-heavy/scheduled → Node `apps/api`.
- **CONTRADICTION C1** (repeated from `database.md`): §100/§103 "inspect the existing
  repository" — greenfield, no existing repo. Confirmed by god; all "existing" read as "create".
- **Boundary honored:** Darryl owns package.json/tsconfig/CI/scaffold; this doc describes
  structure only and creates no source files. Design-system internals = Jim.
