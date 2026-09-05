# Phase 1 — Schema-Independent Work DAG (`phase1-plan.md`)

Author: Jan (G-57). **Proposal, not cards** — god writes `tasks.json`. Builds on the existing
`roadmap.md` (Phase 1 = FOUNDATION); this doc is the *what-can-move-now* cut of that phase, sorted
by one line: **does correctness depend on real tables / real RLS / real query results?**

**A pre-existing plan does exist** — `docs/roadmap.md` (phases + gates). This is not a parallel plan;
it's roadmap Phase 1 decomposed against today's blocker.

## The sort line (why this split is safe, not padding)
The DDL **shape** (columns, types, enums) is signed off and frozen in `database.md`. The unapplied
migration + unrun pgTAP (**G-52, human-gated**) validate **RLS policy behaviour**, *not* column shape.
So work keyed to the frozen shape — types, validation, UI, the in-memory exercise adapter, pure
calculations — carries **LOW rework risk**. Only work whose correctness is a **query result or an RLS
outcome** is HIGH risk, and that is exactly the schema-blocked set below. The DAG sorts on that line.

## TWO HARD CONSTRAINTS (not footnotes)
1. **ATTRIBUTION IS IN THIS SLICE, LEGAL, NON-CUTTABLE.** WG images are CC BY-SA 4.0 → the
   `Settings > About > Open Source Licenses` screen crediting **Bryl Lim** and **Everkinetic** is a
   legal requirement and appears as a first-wave unit (**P1-ATTR**), not deferred. A recoloured/
   modified WG frame must NEVER be pre-baked — tint only at render time.
2. **NO UNIT MAY TOUCH THE DATABASE.** No unit runs a DB command, runs/edits the migration to apply
   it, links the Supabase project, or runs pgTAP. That is **G-52** and it is god's + the human's.
   Installing an npm dependency (e.g. the WG package) is *not* a DB op and is allowed.

Owner routing (live roster): **jim** (frontend), **dwight** (backend/logic), **angela** (QA),
**oscar** (review — gates each unit's "done" with evidence). **darryl is CONSTRAINED (~26M) — assigned
nothing here.** Current scaffold already has the nav shell + empty screens (G-33) and the pure
e1RM/PR logic (G-41); units below *fill* that, they don't recreate it.

---

## SCHEMA-INDEPENDENT units (can proceed now)

| id | objective (one line) | deps | owner | note |
|----|----------------------|------|-------|------|
| **P1-DS** | Realize `design-system.md` tokens + core components in `packages/ui` (Button/Input/Card/Typography/EmptyState + loading/error), light+dark | — | jim | shape-free; pure UI |
| **P1-TYPES** | Hand-author `packages/types` row/enum types from `database.md` DDL (the frozen shape) | — | dwight | LOW risk; **reconcile against `supabase gen types` after G-52** |
| **P1-VALID** | `packages/validation` Zod schemas for MVP entities + form inputs; unit-tested vs fixtures | P1-TYPES | dwight | encodes shape, not queries |
| **P1-WGADAPT** | `packages/exercises`: add `@bryllim/workout-guide` dep; build in-memory `ExerciseProvider` (normalize/search/filter over 302 exercises) | P1-TYPES | dwight | **NOT** the DB import/seed (blocked). Reads the npm package |
| **P1-EXUI** | Exercise browse/search/filter/detail screens wired to P1-WGADAPT in-memory provider; frames tinted at render time | P1-WGADAPT, P1-DS | jim | real data, zero DB |
| **P1-ATTR** | Finish+verify attribution screen: CC BY-SA credit (Bryl Lim/Everkinetic) **and** surface MIT/code licences so "Open Source Licenses" isn't over-promising (folds in open **G-36**) | P1-DS | jim (screen) ← licence manifest from dwight | **LEGAL, first wave** |
| **P1-STATES** | Fill existing G-33 nav screens with designed loading/empty/error states against mock props (no data wiring) | P1-DS | jim | shape-free |
| **P1-OFFLINE** | Offline machinery from `offline.md`: Zustand active-workout store + SQLite/MMKV durable draft + FIFO queue + LWW-by-`updated_at` reconciliation; unit-tested vs a **mock** sync target | P1-TYPES, P1-VALID | jim | mechanics are schema-independent; real Supabase binding is blocked |
| **P1-METRICS** | Complete pure calc fns in `packages/utils`: workout-finish aggregation (duration/sets/reps/volume) + nutrition local-date grouping; unit-tested (extends G-41) | P1-TYPES | dwight | pure functions |
| **P1-TESTGATE** | (= in-flight **G-55/G-56**) make `turbo run test` meaningful — no false green/red on test-less packages; each unit above lands failing-first | — | angela | tooling |

DAG is acyclic: roots **P1-DS**, **P1-TYPES**, **P1-TESTGATE** feed everything; longest chain is
P1-TYPES → P1-WGADAPT → P1-EXUI (3).

## SCHEMA-BLOCKED — wait for G-52 (say plainly)
- Apply migration + run pgTAP (**G-52, human**).
- `supabase gen types` from the live DB → then reconcile **P1-TYPES**.
- Exercise **import/seed** into the DB (muscles→equipment→categories→WG exercises).
- **Auth end-to-end** — needs the `profiles` table **and** valid keys (double-blocked: the legacy
  anon/service_role JWTs are dead too). Build the auth *UI/validation* now; wire real auth later.
- Any **RLS cross-user isolation** test, any **API integration** test hitting real tables, workout
  **persistence round-trip**, progress **query** correctness. All HIGH rework risk until validated.

---

## START THESE FIRST (3–5) and why
1. **P1-DS** — no deps, Jim idle, highest UI fan-out (every screen unit waits on it).
2. **P1-TYPES** — no deps, Dwight idle, highest backend fan-out (validation, adapter, offline, metrics all depend on it).
3. **P1-WGADAPT** — the single biggest "feels like a real app" win available with **zero DB**: real 302-exercise data + search/filter. Deps only P1-TYPES.
4. **P1-ATTR** — legal, non-cuttable, already mostly built; lock it in early so it can't regress, and it retires the open G-36. Deps P1-DS.
5. **P1-VALID** — cheap, unblocks offline + all forms. Deps P1-TYPES.

**Why this set:** they are the DAG roots (no/shallow deps), they fill the 3 idle builders (Jim×UI,
Dwight×types/adapter) plus Angela's in-flight test gate, **none touch the DB**, and together they turn
today's empty nav shell into real design + real exercise data — the maximum real-app progress
reachable while G-52 is human-blocked. If the honest answer were "little moves without the DB," I'd
say so — but the exercise system (real npm data), the entire design/UI layer, validation, offline
mechanics, and pure calculations are all genuinely schema-independent. Attribution is pinned in.
