# Workout Semantics — PR detection, e1RM, and write idempotency (authoritative)

**Owner:** Dwight (correctness/business-logic). **Status:** rulings settled 2026-09-02, conv gainly-phase0.
This doc is the **source of truth for the three open semantic decisions** god routed (PR tie-handling, PR
"highest reps" scope, idempotency key). Angela writes tests to match this; Jan applies the schema deltas in
§4 to `database.md`. Where this contradicts an earlier assumption in `testing.md`/`offline.md`, **this doc wins**
(they explicitly deferred to "Jan/Dwight").

Spec anchors: §16 PR detection, §55 estimated 1RM, §39 offline sync, §101 (L3157 — correctness & data
integrity above all).

---

## 1. Personal Record semantics (§16)

### 1.1 Tie-handling — **strictly greater (`>`), never equal**
A set sets a PR only if it **strictly exceeds** the current best for that (user, exercise, pr_type). Equaling
your best is *matching*, not *setting*, a record.

- Rationale: a "record" means beating the prior best. Without strict `>`, a user who benches 100kg×5 every week
  gets a "New PR!" every session for the same performance — celebration noise that erodes trust (§101).
- **First-ever set** for an (exercise, pr_type) IS a PR (no prior baseline). This is the only case a
  non-exceeding value flags — there is nothing to exceed. (Matches `testing.md §4.3` case (d).)
- **Free idempotency property:** because equal ≠ PR, re-running detection over already-recorded data flags
  nothing new (the value now equals the current best). Strict `>` makes PR detection safe to re-run — see §3.
- **Same-session tie provenance:** if two sets in one session both produce the same new max, attribute the PR
  to the **earliest `completed_at`** set (stable provenance). Only one PR row per (set, pr_type) — see §4.

This matches Angela's assumption in `testing.md:218` ("must be strictly greater") — **no divergence**.

### 1.2 "Highest reps" scope — **per (exercise, weight): most reps at that weight**
`max_reps` is scoped **holding weight constant**: the record is "the most reps you have done *at this weight*",
evaluated within each weight bucket, not across all weights.

- Rationale: reps are only comparable at equal load. "8 reps @ 100kg" beating "6 reps @ 100kg" is a real PR.
  Comparing reps across weights is apples-to-oranges — and "any weight" lets a light set corrupt the record
  (30 reps @ 20kg would forever outrank 5 reps @ 100kg, which is meaningless as strength). Cross-weight strength
  is already captured by `max_e1rm`.
- This is the industry-standard rep-PR (Strong, Hevy track rep PRs per weight).
- **Current-best key for `max_reps`:** `(user_id, exercise_id, pr_type='max_reps', weight)`. Requires a `weight`
  context column on `personal_records` (see §4, delta D3).
- **Bodyweight / duration exercises** (`weight IS NULL`): the `NULL` weight is its own bucket — e.g. "most
  push-ups in a set" competes only against other bodyweight sets. Correct by construction.
- Cost tradeoff (accepted): a user accrues one `max_reps` PR row per distinct weight used. This is correct and
  bounded by how many loads they actually train at; it is a GROUP-BY key change, not extra tables or code.

Resolves the `testing.md:213` / `:311` ambiguity → **reps at a given weight**, not any weight, not a threshold.

### 1.3 PR type catalog (confirming Jan's `pr_type` enum)
| pr_type | `value` = | current-best key (what "beats" means) |
|---|---|---|
| `max_weight` | heaviest weight (kg) for a completed set | `(user, exercise)` — heaviest load ever |
| `max_reps` | rep count | `(user, exercise, weight)` — most reps **at that weight** (§1.2) |
| `max_e1rm` | estimated 1RM (kg, §2) | `(user, exercise)` — best estimated single |
| `max_volume` | set volume `weight*reps` (kg) | `(user, exercise)` — heaviest single-set volume |

`max_volume` is **per-set** volume (not per-session) to keep provenance to one `workout_set_id`. A separate
session-volume metric, if wanted later, is a cached session stat (`workout_sessions.total_volume`), not a PR.
Only `weight_reps` / `bodyweight_reps` / `assisted_bodyweight` exercises get weight/e1RM/volume PRs; `duration`
and `distance_duration` exercises are out of scope for these four PR types (their records, if any, are a later
"best time/distance" feature — flagged, not built).

---

## 2. Estimated 1RM (§55) — Epley with a reps=1 special case
```
e1RM = reps === 1 ? weight : weight * (1 + reps / 30)          // Epley
```
- Base formula matches `testing.md §4.2`: `100kg × 5 → 116.67`. **Confirmed.**
- **reps=1 special case (refinement to testing.md §4.2):** a true single IS the 1RM by definition, so return the
  actual weight (`100×1 → 100`), **not** Epley's inflated `103.33`. Blindly applying Epley to a logged 1RM
  overstates it by ~3% and would let a genuine single be beaten by a lighter multi-rep estimate. Angela asked to
  "confirm this matches" (`testing.md:202`) — **it does not; use the special case.** This is a deliberate change;
  Angela should update the reps=1 expected value to `100.00`.
- Always displayed with the "Estimated 1RM" label (§55). e1RM is an estimate; still compute it for high reps but
  it is advisory. No hard rep cap in v1 (YAGNI) — the label carries the caveat.

---

## 3. Write idempotency (§39) — the anti-duplicate contract

**Problem (from `testing.md §4.6`):** a queued write retried after a flaky ack (client didn't see the success,
server did persist) must not create a duplicate set/session. Duplicates are user-visible history corruption
(§101). Every offline/queued write is an **UPSERT on a stable, client-generated key** — never a blind INSERT.

| Level | Idempotency key | Constraint | Status |
|---|---|---|---|
| Session | client-generated `client_uuid` | `unique (user_id, client_uuid)` | **column exists, constraint MISSING → add (D1)** |
| Session-exercise | client-generated `client_uuid` | `unique (session_id, client_uuid)` | **column + constraint MISSING → add (D2)** |
| Set | natural `(session_exercise_id, set_number)` | `unique (session_exercise_id, set_number)` | already present ✔ |
| PR (provenance) | `(workout_set_id, pr_type)` | `unique (workout_set_id, pr_type)` | **add (D4)** |

Rules that make the keys actually idempotent:
1. **`set_number` is CLIENT-assigned and stable across retries** — the client knows "this is set 3 of this
   exercise." If the server auto-incremented it, a retry would become "set 4" = a duplicate. So: client assigns,
   server upserts `ON CONFLICT (session_exercise_id, set_number) DO UPDATE`. A genuinely new set is a new
   `set_number` → distinct key → correctly a new row. Retry vs. intent is disambiguated by the natural key.
2. **`workout_sessions.client_uuid` must be unique per user** (D1) — without the constraint it is just a column,
   not an idempotency key (`offline.md:104` flags exactly this: "confirm it survives migration"). It survives *and*
   must carry `unique (user_id, client_uuid)`.
3. **`session_exercises` needs its own `client_uuid`** (D2): `(session_id, position)` is NOT a stable replay key
   because position mutates on reorder, and `exercise_id` is not unique within a session (the same exercise can
   appear twice — e.g. two bouts). A client-generated id is the only stable key.
4. **PR detection is idempotent** two ways: strict `>` (§1.1) means a replayed finish flags no new PR, and
   `unique (workout_set_id, pr_type)` (D4) hard-stops a duplicate provenance row even if detection double-runs.
   Insert PRs with `ON CONFLICT (workout_set_id, pr_type) DO NOTHING`.
5. **Finish is idempotent** (already in `offline.md:56` / `api.md §5`): re-finishing recomputes the same cached
   metrics; combined with the above, draining the queue twice converges to identical server state.

---

## 4. Schema deltas handed to Jan (apply in `database.md`; I do not edit his file)

All four are additive and reversible (drop constraint / drop column to roll back). None touch existing data.

- **D1** `workout_sessions`: add `constraint workout_sessions_client_uuid_unique unique (user_id, client_uuid)`.
  (`client_uuid` column already exists at `database.md:334`.) Nullable is fine — the constraint only bites when
  a `client_uuid` is present; server-created sessions may leave it null.
- **D2** `workout_session_exercises`: add `client_uuid uuid` column + `unique (session_id, client_uuid)`.
- **D3** `personal_records`: add `weight numeric` context column (nullable). Populated for `max_reps` (the bucket
  weight) and naturally equals `value` for `max_weight`. This is what makes §1.2's per-weight rep PR expressible.
- **D4** `personal_records`: add `unique (workout_set_id, pr_type)` for PR-insert idempotency (§3 rule 4).
  Note `workout_set_id` is nullable (`on delete set null`); a partial unique index `where workout_set_id is not
  null` is the precise form so multiple historical PRs with null provenance don't collide.

Migration is a straight `ALTER TABLE ADD` set; rollback is `DROP CONSTRAINT` / `DROP COLUMN`. No backfill needed
for a greenfield build (no rows yet).

---

## 5. What each teammate does with this
- **Angela (tests):** PR matrix uses strict `>` (§1.1); `max_reps` cases must fix a weight and vary reps at that
  weight (§1.2); e1RM reps=1 expected value is **100.00**, not 103.33 (§2); idempotency test replays a
  session/exercise/set write twice and asserts one row via the §3 keys.
- **Jan (schema):** apply D1–D4 (§4).
- **Me (Dwight):** owns this doc; will fold the same rulings into `api.md`'s service contracts only if god wants
  them there too (told him where it landed).

---

## 6. Workout Guide sync-scope trigger (`enforce_wg_sync_scope`) — G-14 (authoritative)

The WG-sync invariant (an import may only create/modify `source='workout_guide'` rows, never user
data) is enforced by a **trigger, not RLS**: the importer runs as `service_role`, which bypasses RLS
and every policy, so a role-scoped policy is silently inert against the exact actor it targets. A
`before insert/update/delete` row trigger fires for all roles. Canonical SQL + pgTAP live in
`rls.md §8`; this section is the authoritative semantics.

### Two-guard design (why)
- **Guard 1 — `source` is immutable on an existing row, always on, no flag, fail-closed.** An UPDATE
  may never change `exercises.source`. This *structurally* kills the hijack (below) for every actor,
  independent of whether the importer set its context flag. `is distinct from` makes it null-safe.
- **Guard 2 — flag-gated import scope, defense-in-depth.** Inside an import txn (`set local
  app.import_context='workout_guide'`), only `source='workout_guide'` rows may be touched at all, for
  any field. Reads OLD on DELETE, NEW on INSERT/UPDATE.

Compatibility: guard 1 breaks no current write pattern — the importer only inserts new WG rows or
updates their non-`source` metadata, and no MVP user/admin flow mutates `source`. The only future
feature that would need to change `source` is "admin promotes a custom exercise into the shared
library"; if ever built it must be a deliberate, separately-audited operation with its own narrow
context, **not** a loosening of guard 1.

### Verdicts on the four reviewed defects
1. **`new.source` on DELETE — fix adopted, "error" severity refuted.** On DELETE, NEW is SQL NULL but
   typed to the table rowtype, so `new.source` is NULL (not an error) and the old `coalesce(new.source,
   old.source)` correctly yielded `old.source`. The read worked; the pattern was fragile. Replaced with
   an explicit `TG_OP` branch that never references NEW on DELETE.
2. **`return coalesce(new, old)` — fix adopted, "silently cancels in practice" refuted.** It is
   type-valid and, since one of NEW/OLD is always non-null in a row trigger, never returned NULL in
   normal operation. But it leans on the "a row is NULL iff all its fields are NULL" footgun; a future
   refactor could make it return NULL and a NULL return from a BEFORE row trigger silently cancels the
   write. Replaced with explicit `return old` (DELETE) / `return new`.
3. **The bypass — CONFIRMED, real.** On UPDATE `new.source` is non-null, so `coalesce(new.source,
   old.source)` only ever tested NEW. An import could UPDATE a `source='user'` row while setting
   `new.source='workout_guide'`; the check passed and the user's row was hijacked into the WG library.
   Closed two ways now: guard 1 (source can't change at all) and guard 2 (new.source must be WG).
4. **Fail-open — CONFIRMED; ruling: split the invariant.** The two-guard design moves the headline
   corruption (source hijack) onto the always-on, fail-closed guard 1, so a forgotten `set local` can
   no longer cause it. Guard 2 remains flag-gated and is therefore still fail-open by nature — see
   residual weakness.

### What this protects against — and what it does NOT
It **prevents**, for every role including `service_role`: (a) ever changing an existing row's `source`
(so no user↔WG hijack in either direction), and (b) an import transaction touching, inserting, or
deleting any non-`workout_guide` row. It does **NOT** protect against a write that both (i) omits
`set local app.import_context='workout_guide'` **and** (ii) leaves `source` unchanged: guard 2 is
inert without the flag and guard 1 only bites on source changes, so an importer that forgets its flag
could still UPDATE a user row's *non-source* fields. This residual gap is largely irreducible — the DB
cannot recognize "an import" unless the caller declares itself — but it is bounded to non-source-field
edits and is covered by the importer's own `WHERE source='workout_guide'` scoping as a third layer. If
stronger closure is ever required, run the importer under a dedicated least-privilege login (not
`service_role`) and add an RLS `with check (source='workout_guide' and created_by is null)` on top;
that role/policy are out of scope until such a rework.

### G-14 addendum — INSERT case (Oscar G-17 A3), closed by a CHECK
The trigger did NOT cover a plain user INSERT: guard 1 is UPDATE-only, guard 2 fires only inside an
import transaction, and `exercises.ins_own_custom`'s `with check` says nothing about `source` — so a
user could `insert ... source='workout_guide', created_by=self, is_custom=true`. Not a cross-user leak
(`sel_active_public` requires `created_by is null`, so the row stays in the author's own view) but it
violates the WG-source invariant and would confuse importer reconciliation, `unique(external_source,
external_slug)`, analytics, and any "is this a library exercise" check.

Closed by an **always-on table CHECK** (sibling to guard 1, no flag, unbypassable by any role incl
`service_role`, can't be forgotten):
```sql
alter table exercises
  add constraint exercises_wg_source_is_library
  check (source <> 'workout_guide' or created_by is null);
```
Rationale: a `workout_guide` row is by definition a global library row, so `source='workout_guide'` ⟹
`created_by IS NULL` — exactly what `sel_active_public` already keys on. True by construction: the
importer inserts library rows with `created_by=null`; custom exercises use `source='user'`. A CHECK is
strictly better than trigger logic here because the rule is single-row (references only the new row's
own columns) and a table constraint cannot be role-bypassed or forgotten. Canonical home is the
`exercises` DDL in `database.md` (Jan mirrors it; rollback = `drop constraint
exercises_wg_source_is_library`). pgTAP T7 in `rls.md §8` covers it.
