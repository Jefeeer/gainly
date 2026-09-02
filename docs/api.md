# Gainly — API Architecture (`api.md`)

Owner: Jan. Covers §103 item 10. Sources: §64 (L2230), §65 (L2268), §3 (L129), §34 (L1671),
§82 (L2825), §93 (L2983). Priority §101: correctness > integrity > security.

---

## 1. Two access paths (deliberate split)

Gainly clients reach data through **two** channels, chosen per operation:

1. **Direct Supabase (RLS-gated)** — default for user-owned CRUD reads/writes. The mobile/web
   app uses `supabase-js` with the user's JWT; RLS (`rls.md`) authorizes. Powers TanStack Query
   (§38). Lowest latency, works offline-friendly. Used for: workouts, sets, templates, body
   logs, nutrition logs, goals, favorites, profile reads.
2. **`apps/api` REST service (Node/TS)** — for anything that must not run on a client (§3
   L138): Stripe/subscription webhooks, push orchestration, health sync, analytics aggregation,
   AI, cross-user/admin reads, and any multi-step transaction needing service-role. Also the
   home for the §64 resource endpoints that wrap non-trivial business logic (finish workout, PR
   detection, progress aggregation).

REST where simple; **no GraphQL** without strong reason (§64 L2264).

---

## 2. Standard response envelope (§65 L2268)

Every `apps/api` response (success and error) uses:

```jsonc
// success
{ "data": { /* payload */ }, "error": null }
// error
{ "data": null, "error": { "code": "WORKOUT_NOT_FOUND", "message": "Workout not found", "details": null } }
```

- `error.code` — stable machine string (SCREAMING_SNAKE); clients branch on this.
- `error.message` — safe, user-presentable.
- `error.details` — optional safe context (e.g. Zod field errors); **never** stack traces
  (§65 L2287).
- Lists add `meta`: `{ "data": [...], "error": null, "meta": { "page": 1, "pageSize": 50, "total": 210 } }`.

Direct-Supabase calls return supabase-js's native shape; a thin client wrapper normalizes them
into the same `{data,error}` envelope so features consume one shape everywhere.

---

## 3. Resource map (§64 L2234)

Base: `/v1`. Auth: `Authorization: Bearer <supabase JWT>`; `apps/api` verifies the JWT and
resolves `auth.uid()` before any query.

```text
# Identity
GET   /me                         -> profile + settings + subscription summary
PATCH /me                         -> update profile/settings (Zod: ProfileSchema)

# Exercises (mostly served direct-Supabase; API path for admin only)
GET   /exercises?query&muscle&equipment&type&favorites&page   -> search/filter (§58, §11, §13)
GET   /exercises/:id              -> details + muscles + aliases + media
POST  /exercises                  -> create custom exercise (is_custom, created_by=me)
PATCH /exercises/:id              -> edit own custom / admin edit

# Workouts (finish + metrics = business logic → API; simple reads = direct)
GET   /workouts?status&page       -> session history (idx_sessions_user_started)
POST  /workouts                   -> start session (optional template_id) — idempotent on client_uuid
GET   /workouts/:id               -> session + exercises + sets (nested)
PATCH /workouts/:id               -> rename/notes/reorder
POST  /workouts/:id/finish        -> compute metrics (§17), detect PRs (§16), set ended_at
DELETE/workouts/:id               -> discard (status='discarded')

# Templates & programs
GET   /templates ; POST /templates ; GET/PATCH/DELETE /templates/:id
POST  /templates/:id/duplicate            (§14 L1265)
POST  /templates/from-session/:sessionId  -> save a finished workout as template
GET   /programs ; POST /programs ; GET/PATCH/DELETE /programs/:id

# Progress (read models / aggregation → API for heavy queries)
GET   /progress                            -> overview (streak, weekly count, volume trend)
GET   /progress/exercises/:exerciseId?range -> strength charts: max wt, e1RM, volume, max reps (§19)
GET   /progress/records                    -> personal records (§16)
GET   /workouts/:id/previous               -> previous performance for each exercise (§9 L476)

# Body & nutrition
GET   /body/measurements ; POST /body/measurements
GET   /body/weight ; POST /body/weight
GET   /nutrition/day/:date                 -> meals + food_logs + water + totals (local date §88)
POST  /nutrition/log                       -> add food_log (creates meal slot if absent)
DELETE/nutrition/log/:id
GET   /nutrition/goals ; PUT /nutrition/goals

# Goals & activity & health
GET   /goals ; POST /goals ; PATCH /goals/:id
GET   /activity/day/:date ; POST /activity            (manual + health-sync writes)

# Server-only / webhooks (no client select)
POST  /webhooks/stripe            -> subscription state (service role, signature-verified §46)
POST  /push/register              -> device_tokens upsert
POST  /health/sync                -> HealthSyncService ingest (§27/§28)
POST  /admin/*                    -> admin ops (is_admin gate + audit log §95)
```

A5 FIX (Oscar G-17): `GET /exercises/:id` on an archived exercise in history is served
**direct-Supabase** via the `sel_archived_in_history` RLS policy (`rls.md §3`), scoped to
exercises in the caller's own sessions. The former service-role resolver is **removed** — a
fetch-by-id via service role bypasses RLS and was an IDOR (could return another user's private
custom exercise). No service-role read path is used for exercises (§87).

---

## 4. Validation & error contract (§36, §65)

- **Every** write validates the body against a `@gainly/validation` Zod schema **server-side**
  (§36 L1717 — never trust client validation). Failure → `422` +
  `error.code="VALIDATION_FAILED"` + per-field `details`.
- Canonical error codes: `UNAUTHENTICATED (401)`, `FORBIDDEN (403)`, `NOT_FOUND (404)`,
  `VALIDATION_FAILED (422)`, `CONFLICT (409, e.g. offline dedupe)`, `RATE_LIMITED (429)`,
  `INTERNAL (500, generic message only)`.
- The same Zod schemas run client-side for instant UX and server-side for trust — one
  definition, two call sites (§36 L1701).

---

## 5. Idempotency & offline (ties to `offline.md`)

- Every offline-creatable write carries a stable client key and is an **UPSERT** (reconciled with
  Dwight, `database.md §13` D-e): sessions on `unique(user_id, client_uuid)`, `session_exercises`
  on `client_uuid`, sets on `(session_exercise_id, set_number)` with a **client-assigned**
  `set_number`. Re-sending returns the existing row (`200`, not a duplicate) — this is how the
  offline sync queue safely retries (§39). Duplicate key → `409 CONFLICT` resolved to the
  canonical row. The server never auto-increments `set_number` (that would make a retry a
  duplicate set).
- `POST /workouts/:id/finish` is idempotent: re-finishing a completed session returns the same
  computed metrics without recomputing PRs. The `pr_dedupe_by_set` partial unique
  (`database.md`, Dwight D4) is the DB backstop against a retried finish double-inserting a PR.

---

## 6. Performance rules (§82)
- During an active workout the client caches exercise metadata + previous performance
  (TanStack Query, §82 L2829) and writes sets optimistically (§83) — **no per-set round trip**
  blocks the UI.
- Set writes batch on a debounce and on finish; integrity preserved because each set carries a
  stable `(session_exercise_id, set_number)` unique key (`database.md §7`).
- List endpoints paginate (`page`,`pageSize`, default 50) and are backed by the §35 indexes.

---

## 7. Backend services behind the API (§93)
`apps/api` composes independently-testable services: `WorkoutService`, `ExerciseService`,
`PersonalRecordService`, `NutritionService`, `GoalService`, `SubscriptionService`,
`NotificationService`, `AnalyticsService`, `HealthSyncService`, `AIService`. Route handlers are
thin; logic + Zod live in services (§91 L2950, §93 L3000).

---

## Assumptions & flagged contradictions
- **A1** Hybrid direct-Supabase + REST is inferred: §64 specifies REST resources while §3/§34
  imply clients use Supabase directly. Rule: user-owned CRUD → direct (RLS); business
  logic/secrets/cross-user → `apps/api`. If a pure-API architecture is required, the resource
  map already covers it — flip the toggle per feature.
- **A2** `/v1` version prefix and `meta` pagination block are additions (§65 shows only
  `{data,error}`); non-breaking supersets of the spec's envelope.
- **A3** PR detection runs in `POST /finish` (service), consistent with `database.md §10`
  (not a DB trigger).
- No API-specific spec contradictions beyond the shared greenfield note (C1).
