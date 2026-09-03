# Gainly — Testing Strategy & QA Critical Flows

Owner: Angela (QA). Refs: GAINLY_MASTER_BUILD_PROMPT.md §16, §33-36, §39, §46, §55, §67, §68, §81, §87, §89, §101, §103.

Ground rule (§103 L3275): **do not claim something works without testing it.** No card moves to `done`
without the test in this doc passing, observed green, in CI.

---

## 1. Test pyramid

| Layer | Owns | Tool | Runs against |
|---|---|---|---|
| Unit | Pure logic: 1RM math, unit conversion, PR detection, volume/duration calc, Zod schemas | **Vitest** | `packages/*` in isolation, no I/O |
| DB / RLS | Row Level Security policies, constraints, triggers | **pgTAP** | Local Supabase Postgres (`supabase start`) |
| Integration | supabase-js calls against real Postgres+Auth+Storage; Edge Functions; Stripe webhook handlers | **Vitest** | Local Supabase stack (Docker), Stripe CLI fixtures |
| RN component | Screens/components render, interact, reflect Zustand/TanStack state | **Jest + jest-expo preset + @testing-library/react-native** | `apps/mobile` |
| Web component | Next.js pages/components | **Vitest + @testing-library/react** | `apps/web`, `apps/admin` |
| E2E mobile | Full user flows on a real/simulated device, black-box | **Maestro** | EAS dev-client / preview build, iOS+Android |
| E2E web | Marketing, auth, web dashboard flows | **Playwright** | `apps/web`, `apps/admin` |

### Why these tools

- **Vitest over Jest for `packages/*` and web**: pure TS/ESM, no RN transform needed, faster, already the
  de facto default for new Vite/Next projects. Reuse one runner for every non-RN package instead of adding
  a second config per app.
- **Jest (jest-expo) for `apps/mobile` only**: RN component tests require Metro's transform pipeline, which
  `jest-expo` provides out of the box. This is not a preference — Vitest cannot execute RN's native module
  mocks. Scope Jest to mobile only; do not spread it to packages that don't need it.
- **Maestro over Detox for mobile E2E (the hard call)**: Detox requires ejecting or deep native build
  coupling to link its native test runner into the app binary — this fights Expo's managed workflow and
  routinely breaks on Expo SDK upgrades. Maestro drives the compiled app (EAS dev-client or preview build)
  from outside via the accessibility tree: zero app-side code changes, YAML flow files that map 1:1 to the
  given/when/then specs below, and a hosted device cloud (Maestro Cloud) that plugs into the GitHub Actions
  pipeline from §69 without self-hosted device farms. Expo's own docs recommend Maestro for this reason.
  Trade-off accepted: less low-level control than Detox (e.g. no direct native module mocking) — acceptable
  because E2E's job here is black-box user-flow verification, not unit-level native behavior.
- **pgTAP for RLS**: RLS is a database-layer guarantee. Testing it only through the app (supabase-js) means
  a bug in application code could mask a working policy, or a broken policy could be masked by app code
  that happens to filter correctly. pgTAP runs `SET ROLE`/`SET request.jwt.claims` and asserts directly at
  the SQL layer — the same layer the policy lives in. This is belt-and-suspenders with the integration tests
  below (§4), not a replacement for them.
- **Playwright for web E2E**: official Next.js support, one runner for both `apps/web` and `apps/admin`.

Tooling names above are the spec Darryl wires into config/CI. This doc does not install anything.

---

## 2. §68 QA critical flows — given/when/then specs

Each flow below is one runnable spec. Layer = primary layer that owns it; most also get a component-test
counterpart for the failure/loading states.

### Auth

1. **Registration**
   Given a new email not in the system, When the user submits email+password (or OAuth) and confirms,
   Then an `auth.users` row and a matching `profiles` row exist, and the user lands on onboarding.
   *(Integration + Maestro)*

2. **Login**
   Given a registered, confirmed user, When they submit correct credentials, Then they receive a valid
   session and land on the home dashboard.
   *(Integration + Maestro)*

3. **Logout**
   Given a logged-in user, When they log out, Then the local session/token is cleared and protected routes
   redirect to login. *(RN component + Maestro)*

4. **Password recovery**
   Given a registered email, When the user requests a reset and follows the emailed link, Then they can set
   a new password and log in with it (old password no longer works). *(Integration)*

5. **OAuth (Google, Apple)**
   Given a user completes the provider consent screen, When Supabase Auth exchanges the OAuth code, Then a
   `profiles` row is created/linked and the session is valid. Also: same email via OAuth and via
   email/password must not silently merge accounts without an explicit link step.
   *(Integration; provider mocked at the OAuth-callback boundary)*

6. **Onboarding**
   Given a first-time user, When they complete each onboarding step (units, goals, profile basics), Then
   `profiles.onboarding_completed_at` is set and they are not shown onboarding again on next launch.
   *(RN component + Maestro)*

### Workout core (highest priority — see §3 below for the loop)

7. **Start workout** — Given a logged-in user with no active session, When they tap "Start Workout", Then a
   `workout_sessions` row is created with `started_at` and the workout screen shows an empty exercise list.
8. **Add exercise** — Given an active workout, When the user searches and selects an illustrated exercise,
   Then it appears in the session with its demo image/video loaded and a first empty set row.
9. **Complete set** — Given an exercise with a draft set (weight, reps), When the user marks it complete,
   Then `workout_sets.completed_at` is set, the rest timer starts if configured, and the UI updates
   optimistically before server ack (§83).
10. **Edit set** — Given a completed set, When the user changes weight/reps, Then the stored values update
    and any dependent PR/1RM calc re-evaluates.
11. **Delete set** — Given a set in an active workout, When the user deletes it, Then it is removed from the
    session and does not count toward summary totals.
12. **Finish workout** — Given an active workout with ≥1 completed set, When the user finishes, Then
    `ended_at` is set, summary totals are computed (§56), and PR detection runs (§4 below).
13. **Resume interrupted workout** — Given an active workout with unsaved local state, When the app is
    killed and relaunched (or backgrounded then foregrounded), Then the draft (exercises, sets, timer) is
    restored exactly, sourced from local persistence, not lost. *(Covers §39 — see §5 below.)*

### Templates & history

14. **Create template** — Given a workout (active or completed), When the user saves it as a template, Then
    it appears in the template list with its exercise/set structure, decoupled from the source session.
15. **Use template** — Given a saved template, When the user starts a workout from it, Then a new
    `workout_sessions` is created pre-populated with the template's exercises and the user's **previous
    logged values** for each (not the template's static values) — this is what §81 calls "see previous
    values."
16. **View workout history** — Given a user with ≥1 completed workout, When they open history, Then past
    sessions list in reverse-chronological order with correct summary data, and an empty state shows for a
    user with zero workouts (§84).

### Body & nutrition

17. **Record body weight** — Given a user, When they log a weight entry with a unit, Then it's stored
    normalized (§89) and displays correctly reconverted to the user's preferred unit.
18. **Create goal** — Given a user, When they set a fitness goal (target weight/strength/frequency), Then
    the goal persists and progress-toward-goal reflects new logged data.
19. **Log food** — Given a user, When they add a food entry, Then it's attributed to their **local date**
    (§88), not UTC date, and daily totals update.
20. **Log water** — Given a user, When they add a water entry, Then the daily total updates and resets at
    local-midnight boundary.

### Settings & lifecycle

21. **Change units** — Given a user with existing logged data in kg, When they switch to lb, Then all
    displayed values reconvert (§89) and newly entered values store normalized — no data mutation from the
    unit switch alone.
22. **Switch dark mode** — Given a user, When they toggle dark mode, Then the preference persists across app
    restarts and applies to all screens (§31).
23. **Receive notification** — Given a user with notifications enabled, When a scheduled trigger fires
    (e.g. rest-day reminder), Then the notification is delivered and deep-links to the relevant screen.
24. **Delete account** — Given a user, When they confirm account deletion, Then auth access is revoked and
    the account is deactivated per the soft-delete rule in §87 — but "delete account" is a **hard**
    exception to §87 (see below): personal data must actually be erasable to satisfy §90 privacy
    requirements, so this flow needs an explicit spec, not an assumption:
    - historical workout data that references the user is retained only if legally/product-required and
      anonymized; otherwise it is purged.
    - Test asserts: post-deletion, no `profiles`/`workout_sessions`/etc. row is readable via the user's
      former credentials, and re-registering with the same email does not resurrect old data.
    **Flag for Jan/Dwight**: §87 says "prefer soft deletion," §90 says "provide account/data deletion" —
    these are in tension for account deletion specifically (soft-deleted-but-still-queryable data is not
    "deleted" from a privacy standpoint). This doc assumes hard-delete-or-anonymize wins for the *account*
    row; soft-delete stays the default for *exercises* (§87's actual example). Needs an explicit decision in
    their schema doc — see "Spec gaps" at the end.

---

## 3. The MVP loop — ONE end-to-end acceptance test

Per §81, this loop is the product. It is named, it is one test, and it must never be red on `main`.

**`e2e/mvp-loop.spec.yaml`** (Maestro, run on both iOS and Android in CI):

```text
Test: mvp_core_loop
Given: a fresh test account (registered via API fixture, not through the UI, to keep this test
       focused on the loop itself rather than re-testing registration)
1. Launch app, log in
2. Complete onboarding
3. Start first workout
4. Search "bench press", select the illustrated result, confirm demo image is visible
5. Log 3 sets (weight, reps), completing each
6. Finish workout
7. Assert workout summary shows correct duration, volume, sets, reps
8. Kill and relaunch app (simulates "return later")
9. Start a new workout from the same exercise (or template)
10. Assert previous session's weight/reps are shown as the reference/prefill values
11. Log a set with weight or reps higher than the previous best
12. Finish workout
13. Assert a PR is flagged for that exercise
14. Open progress view, assert the strength trend for that exercise reflects both sessions
```

This test must pass before any release build ships (§81: "This loop must feel excellent before expanding
the product" — it cannot feel excellent if it's untested). It runs on every PR that touches
`apps/mobile`, `packages/database`, or `supabase/migrations`.

---

## 4. High-risk correctness areas (§101: correctness > data integrity > security first)

### 4.1 Unit conversion (§89)

Unit tests in `packages/validation` or `packages/utils` (wherever conversion lives):

- kg↔lb round-trip within acceptable float tolerance (e.g. `100kg -> lb -> kg` returns 100 ± 0.01).
- cm↔in, km↔mi, ml↔fl oz, same round-trip property.
- Storage is always normalized (assert the stored DB value doesn't change when a user only changes their
  *display* unit preference — display-layer conversion, not data mutation).
- Boundary: 0, negative input rejected by Zod schema (weight/reps can't be negative), very large values
  don't overflow/NaN.

### 4.2 Estimated 1RM (§55)

- `1RM = weight * (1 + reps/30)` — exact-value unit tests for known inputs (e.g. 100kg×5reps → 116.67).
- reps=0 edge case (should not be computed / should be excluded, not divide-by-zero — confirm with Jan/
  Dwight what "0 reps" even means as an input; flag if schema allows it).
- **reps=1 boundary — does NOT route through Epley.** Settled in `workout-semantics.md §2`: a true single
  IS the 1RM by definition, so `e1RM(weight=100, reps=1)` must equal **100.00** (the actual weight), not
  Epley's `103.33`. Blindly applying Epley at reps=1 overstates a genuine max by ~3% and would let a
  lighter multi-rep estimate outrank a real single in the user's strength history — wrong per §101
  (correctness first). Required test: assert the reps=1 branch short-circuits before the formula runs, not
  just that the output happens to match — this is the assertion that catches a regression back to blind
  Epley.
- Output is always displayed with the "Estimated 1RM" label — component test, not just unit test.

### 4.3 Personal record detection (§16)

Given a new completed set/session, PR detection must independently check each of:
- highest weight (for that exercise) — key `(user, exercise)`
- highest estimated 1RM — key `(user, exercise)`
- highest reps **at that weight** — key `(user, exercise, weight)`. Settled in `workout-semantics.md §1.2`:
  scope is per (exercise, weight), not any-weight or a threshold — reps are only comparable at equal load
  (8@100kg beating 6@100kg is a real PR; 30@20kg should never outrank 5@100kg). Test matrix for this PR
  type must fix the weight and vary reps at that weight, plus a separate case proving a different weight
  bucket is independent (a new rep max at 60kg does not touch the 100kg bucket's record).
- highest workout volume (session-level, not per-set)
- best distance / best duration (cardio exercises)

Test matrix: for each PR type, (a) new value below all-time best → no PR flagged, (b) new value equal to
best → no PR (**strictly greater**, settled in `workout-semantics.md §1.1` — no divergence from this doc's
original assumption), (c) new value above best →
PR flagged and written to PR history, (d) first-ever set for an exercise → PR flagged (no prior baseline to
beat) but must not throw on empty history. (d) is the classic null-baseline bug — explicit test required.

### 4.4 Set/rep persistence mid-workout + crash recovery (§39)

- Local draft write happens on every set completion, not just on "finish workout" — test asserts a draft
  exists in local storage immediately after step 9 in the MVP loop, before "finish" is ever pressed.
- App killed mid-workout (simulated process kill, not graceful background) → relaunch → draft restored with
  correct exercises, sets, weights, reps, elapsed time.
- Connectivity lost after local write but before server sync → set is queued, not lost; reconnect flushes
  the queue; server end-state matches what the user saw locally (no silent divergence).
- Conflict case: same workout session modified from two write attempts (e.g. queued write applied after a
  newer edit) — must not overwrite newer data with stale queued data. This needs Jan/Dwight's conflict
  resolution rule (last-write-wins by timestamp? server-authoritative merge?) — flagged below, this doc
  cannot specify the exact test until that's decided.

### 4.5 RLS isolation (§34) — disproportionate coverage, not a checkbox

Two-pronged, per protected table (`workout_sessions`, `workout_sets`, `body_measurements`, `food_logs`,
`goals`, `profiles`, `subscriptions`, custom exercises):

**pgTAP (policy-level, `supabase/tests/rls/*.sql`)**: for every table, for every operation
(SELECT/INSERT/UPDATE/DELETE):
- as `userA`, can read/write only rows where `user_id = userA`.
- as `userA`, cannot read/write a row owned by `userB` (`SET request.jwt.claim.sub` to userA, attempt
  access to a userB-owned row, assert 0 rows / error, not a silent empty-but-succeeded response with wrong
  semantics).
- as anonymous (no JWT), no access to any row in these tables.
- service-role bypasses RLS by design — assert this is only ever invoked from backend code, never from a
  client bundle (this is a code-review/config check, not a runtime test, but the CI gate should include a
  grep/lint that the service-role key never appears in `apps/mobile` or `apps/web` bundles).

**Integration (app-level, `packages/database` test suite)**: two real authenticated supabase-js clients
(userA, userB created via test fixtures), userA attempts every CRUD op against userB's data through the
actual client library path the app uses — this catches bugs where the policy is correct but application
code accidentally uses a service-role client or bypasses the intended query shape.

A cross-user read/write succeeding in either layer is a release blocker, full stop — see CI gate (§6).

### 4.6 Offline write reconciliation (§39)

Beyond 4.4's crash recovery, specifically the sync layer:
- Queued writes replay in the order they were created once connectivity returns.
- A queued write that fails validation server-side (e.g. rejected by RLS or a constraint) surfaces a
  recoverable error to the user (§85: retry / save locally), not a silent drop.
- Duplicate-submission safety: if a queued write is retried after a flaky ack (client didn't see the
  success response but server did persist it), the retry must not create a duplicate set/session — needs an
  idempotency key or equivalent from Jan/Dwight's schema; flagged below.

---

## 5. Definition of done per phase / CI merge gate

**Per-phase DoD** (maps to §103's Plan → Implement → Type Check → Lint → Test → Fix → Review → Continue):

A phase is not done until:
1. Every §68 flow it touches has its given/when/then spec passing (this doc is the source of truth for what
   "passing" means — a green build with no test written for the flow is not done).
2. `tsc --noEmit` clean, strict mode, no `any` introduced (§91).
3. Lint clean.
4. New/changed logic in §4's high-risk areas has the corresponding test from this doc, not a placeholder.
5. No `TODO` left in code covering core functionality (§103 explicit rule).
6. A human (or reviewing agent) has read the diff — not just seen green CI.

**CI merge gate (GitHub Actions, §69)** — a PR cannot merge unless every step below exits 0, in order.
Commands are what actually runs (via Turborepo at the root unless noted); thresholds are exact, not "mostly
passing." **Wiring status as of G-38 (2026-09-03): steps 1-4 are being wired now under G-37 (Darryl). Steps
5-8 are specified here as the design target — they are not yet wired into any CI config, and nothing in this
list is enforced by an actual pipeline yet.** Update this table's status column instead of the prose above it
as each step lands, so it never silently drifts back into aspirational text.

| # | Step | Command | Threshold | Status |
|---|---|---|---|---|
| 1 | Install deps | `pnpm install --frozen-lockfile` | exit 0 | in flight (G-37) |
| 2 | Lint | `pnpm lint` (= `turbo run lint`, each package's `eslint . --max-warnings 0`) | 0 errors, 0 warnings | in flight (G-37) |
| 3 | Type check | `pnpm typecheck` (= `turbo run typecheck`, each package's `tsc --noEmit`) | 0 errors, strict mode, no new `any` (§91) | in flight (G-37) |
| 4 | Unit + component tests | `pnpm test` (= `turbo run test`: Vitest for `packages/*`/`apps/web`/`apps/admin`, Jest+jest-expo for `apps/mobile`) | 100% of tests green, 0 skipped without a `// TODO(reason)` comment | in flight (G-37); first real specs are `packages/utils/src/e1rm.test.ts` + `packages/utils/src/personal-records.test.ts` (G-38, currently RED — no runner, no implementation yet) |
| 5 | pgTAP RLS suite | `pg_prove supabase/tests/rls/*.sql` (or the Supabase CLI equivalent) against a fresh local Postgres, migrations applied from scratch | 100% of assertions green (all `plan(N)` counts satisfied) | **not wired** — suite exists (`supabase/tests/rls/*.sql`, 12 files) but is deliberately UNRUN; no local Docker/Supabase stack exists yet, and running it requires per-run human authorization (hosted-project safety rule) |
| 6 | Integration suite | `pnpm test:integration` (name TBD when wired) — two real authenticated supabase-js clients against the same local instance as step 5 | 100% green, cross-user access denial confirmed for every §4.5 table | **not wired** — needs the same local Supabase stack as step 5 |
| 7 | Build | `pnpm build` (= `turbo run build`, all apps) | exit 0, no build warnings treated as errors per app's own config | **not wired** |
| 8 | Security checks | dependency audit (`pnpm audit` or equivalent) + the service-role-key-in-client-bundle grep from §4.5 | 0 high/critical advisories; grep finds zero matches in `apps/mobile`/`apps/web` build output | **not wired** |

**Not on every PR** (too slow, run on a schedule + pre-release instead, but still block release):
- Maestro mobile E2E suite, including the named MVP-loop test (§3) — **not wired**.
- Playwright web E2E suite — **not wired**.

Any release build (App Store/Play/production web deploy) is blocked unless the E2E suite, including the
MVP-loop test by name, is green on the exact commit being shipped. This rule applies once E2E is wired; today
there is no release build to gate.

---

## 6. Spec gaps flagged for Jan/Dwight (schema/behavior needed before these tests can be written precisely)

1. **Account deletion semantics** (§24 above): §87 (prefer soft delete) vs §90 (provide real data deletion)
   need an explicit resolution for the `profiles`/account row specifically. Soft-delete-only does not
   satisfy §90 as written. **Open — routed to Jan** (privacy/security decision, not a convenience one).
2. ~~PR tie-handling~~ — **resolved**, `workout-semantics.md §1.1`: strictly greater only (§4.3 updated).
3. ~~PR "highest repetitions" scope~~ — **resolved**, `workout-semantics.md §1.2`: per (exercise, weight),
   not any-weight or a threshold (§4.3 updated).
4. **Offline write conflict resolution rule**: last-write-wins by client timestamp, server-authoritative
   merge, or something else? (§4.4) — cannot write the conflict test's expected outcome without this.
   **Open — routed to Jan.**
5. ~~Idempotency for queued/retried writes~~ — **resolved**, `workout-semantics.md §3`: UPSERT on a
   client-generated key per level (session `client_uuid`, session-exercise `client_uuid`, set
   `(session_exercise_id, set_number)`, PR provenance `(workout_set_id, pr_type)`); duplicate-submission
   safety is testable once Jan applies schema deltas D1/D2/D4.

Items 2, 3, 5 don't block test code anymore — `workout-semantics.md` is the source of truth. Items 1 and 4
are still open, routed to Jan; do not re-chase, wait for his doc to land.
