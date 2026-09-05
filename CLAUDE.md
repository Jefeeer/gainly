# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GAINLY — a fitness tracking platform (workouts, strength progression, nutrition, body metrics, PRs).
Turborepo monorepo: React Native/Expo mobile, Next.js web + admin, Node/TS api, Supabase backend.

**The spec is the source of truth**, not this file and not the code: `../GAINLY_MASTER_BUILD_PROMPT.md`
(3281 lines, 103 numbered sections). Read it by **section line range** — reading it whole will consume
a large fraction of your context. Key anchors:

| § | Line | Topic | § | Line | Topic |
|---|------|-------|---|------|-------|
| 3 | L91 | Stack (fixed, not a choice) | 67 | L2306 | Testing |
| 4 | L202/L208 | Monorepo tree (verbatim) | 68 | L2332 | QA critical flows |
| 13A | L631–1240 | Workout Guide (largest §) | 79 | L2568 | The 13 phases |
| 33 | L1610 | Database | 80 | L2750 | MVP scope |
| 34 | L1654 | RLS | 81 | L2791 | MVP success loop |
| 39 | L1764 | Offline | 100 | L3102 | Build instructions |
| 50/51 | L1968/L2013 | Design system | 101 | L3157 | Engineering priorities |
| 31 | L1575 | Dark mode (required) | 103 | L3224 | Starting task |

**Two spec premises are false — do not act on them:**
1. §100/§103 open with "inspect the existing repository." There was none; this is greenfield.
2. §13A describes the Workout Guide package from *expectation*. §100 L3130 makes the **installed
   package authoritative over the prompt's prose**, and it diverges on five counts (see below).

**Priority order is fixed by §101** and settles design arguments:
correctness > data integrity > security > UX > reliability > maintainability > performance > polish.

## Commands

pnpm workspaces + Turborepo. `packageManager` is pinned to `pnpm@11.23.0`.

```bash
pnpm install              # ⚠️ see "Current state" — this has NOT been run yet
pnpm dev                  # all apps;  dev:mobile | dev:web | dev:admin | dev:api to target one
pnpm typecheck            # turbo run typecheck   (NOT `check-types`)
pnpm lint                 # eslint --max-warnings 0 everywhere
pnpm test
pnpm build
pnpm format               # prettier over **/*.{ts,tsx,md}
pnpm db:migrate           # supabase migration up
pnpm db:seed              # supabase db reset
pnpm exercises:import     # scripts/import-workout-guide.ts
```

Scope to one workspace with turbo filters: `pnpm turbo run <task> --filter=<name>`
(`mobile`, `web`, `admin`, `api`, or `@gainly/<pkg>`). Web is port 3000, admin 3001.
Mobile is Expo: `cd apps/mobile && pnpm start` (or `android` / `ios` / `web`); it has `expo lint`
rather than an eslint script.

**Running a single test** — tooling is decided but not yet installed, so wire it before assuming it
works. Per `docs/testing.md`: Vitest for `packages/*` + web + admin (`vitest run -t "<name>"`),
**Jest + jest-expo + @testing-library/react-native for `apps/mobile` only** (Vitest cannot handle
Metro's transform pipeline), Playwright for web E2E, **Maestro** for mobile E2E, and **pgTAP** for
RLS at the SQL layer (`supabase/tests/rls/*.sql`).

## Expo SDK: 54 is a TEMPORARY trial, 57 is the target

The mobile app was scaffolded on **SDK 57** (`expo ~57.0.19`, RN `0.86.3`, React `19.2.3`,
TS `~6.0.3`) and is being temporarily downgraded to **SDK 54** for one reason only: so the human can
trial the app in the **Expo Go** client they already have, without building a dev client.

- **Do not treat SDK 54 as the architecture.** The long-term target is **SDK 57 + a dev build**.
  Don't "helpfully" align other packages, docs, or §3's stack to 54.
- The downgrade is deliberately **one revertible commit on `main`** (no branch — seven agents share
  one working tree, so a private branch is a trap). Going back is a `git revert`. SDK 57 baseline
  is at `3f0a6ba` and later.
- `scaffold-handover.md` holds the exact before/after version table. **That table is the revert
  instructions** — re-deriving the SDK 57 peer set is the expensive part, so don't pay for it twice.
- `@expo/ui` and `expo-glass-effect` **were NOT dropped** — `expo install --fix` found SDK 54
  counterparts and installed them at pre-release tags (`@expo/ui@~0.2.0-canary-…`,
  `expo-glass-effect@~0.1.10`). Nothing in `src/` imports either, so keeping or removing them is
  zero-impact. (An earlier revision of this file claimed they were removed; that was wrong.)
- **The SDK 54 landing broke 6 template source files, and this is the real cost of the trial.**
  `expo-router@6.0.24` does **not export `ThemeProvider` / `DarkTheme` / `DefaultTheme` at all** —
  verified, zero matches in its `build/index.{js,d.ts}`. `src/app/_layout.tsx:1` imports all three,
  so they are `undefined` at runtime and `<ThemeProvider>` throws *"Element type is invalid"* on
  first render — **a boot crash, not a type error.** `@react-navigation/native@7` is installed and
  is the likely correct home for them. Also broken: SF Symbols typing (`SFSymbols7_0` is narrower),
  `NativeTabTrigger.Label`/`.Icon` sub-components don't exist at this expo-router version, and
  `ColorSchemeName` no longer admits `'unspecified'`.
  **A successful `expo export` does NOT prove any of this is fine** — Metro does not error on a
  missing named export, it just yields `undefined`. Bundle success and boot success are different
  claims.
- `app.json` needs **no schema migration**: SDK 54 uses the same config-plugins array style as 57,
  not a legacy top-level `splash` key.
- **Expo Go cannot load custom native modules**, so health sync, push, and payments will need a dev
  build regardless. That's the ceiling on this trial, not a problem to design around now.

## Current state — read before trusting a green build

- **`node_modules` does not exist. `pnpm install` has never completed**, so typecheck/lint/build are
  unverified. Do not report anything as passing without pasting real command output (§103 L3275).
- Known peer conflicts to expect on first install, already discovered — do not rediscover them:
  **TS `~6.0.3` (mobile) vs `7.0.2` (everything else)** under `node-linker=hoisted`;
  **react `19.2.3` (Expo's set) vs `19.2.8`** elsewhere; Expo/RN under pnpm generally; `zod ^4`.
- **Resolution principle: let Expo's aligned set win for `apps/mobile` and bend the rest to match.**
  Fighting Expo's peer set is what makes RN monorepos unmaintainable. §103 L3277's "prefer latest
  stable" means the template's *coherent* set, not newest-of-each.
- `apps/admin` is deliberately a **mirror of `apps/web`**, not `create-next-app` output. Approved —
  it guarantees a consistent Next set. Don't "fix" it by regenerating.
## Supabase: HOSTED, and the API keys on disk are currently DEAD

This section replaces an earlier one that said "Supabase is local-only, no hosted project exists."
That is **no longer true** and following it would be wrong.

- A **hosted** project exists (`ammtkgqkoahylbqfamsa`). There is **no local Docker stack** and no
  `supabase start`, so there is **no `db reset` safety net** — a bad migration hits a real database
  with no undo. **Never run `supabase link`, `db push`, `db reset`, or psql against it.** Applying a
  migration is a privileged operation god authorises per-run. There is deliberately no `db:push`
  script.
- **`SUPABASE_ANON_KEY` / `EXPO_PUBLIC_…` / `NEXT_PUBLIC_…` in `.env.local` are currently INVALID.**
  The human disabled the project's **legacy** JWT API keys, which deactivates both the `anon` and
  `service_role` JWTs. If you wire a Supabase client right now you will get an auth error, and **the
  bug will not be in your code** — do not spend tokens debugging it. Legacy keys are `eyJ…` JWTs;
  the current key system is `sb_publishable_…` / `sb_secret_…` short strings, and migrating to those
  is pending with the human.
- `SUPABASE_DB_URL` **is** valid and unaffected — it is the session pooler (`:5432`, required for
  DDL and prepared statements) and authenticates by database password, not by API key. So
  DB/pgTAP-shaped work is not blocked by the key problem; API-key-shaped work is.
- `SUPABASE_SERVICE_ROLE_KEY` is a full admin bypass of every RLS rule. Never commit it, never put
  it in a message, and never write a fallback that silently proceeds without it. `.env.local` is
  gitignored (`.gitignore:10`, verified) — keep real values only there, and `.env.example` only
  ever carries placeholders that distinguish the client-safe key from the server-only one.

## Architecture

```
apps/{mobile,web,admin,api}   packages/{ui,config,database,types,validation,
                                        analytics,utils,constants,exercises}
supabase/{migrations,functions,seed,tests}   scripts/   docs/
```

Verified §4-conformant (structural check, 2026-09-02): all 4 apps, all 9 packages, no defects.
`supabase/tests/` and `scripts/generate-brand-assets.mjs` are ratified additions post-dating §4.

**`scripts/` is NOT a workspace member** — `pnpm-workspace.yaml` scopes to `apps/*` and `packages/*`
only, so `scripts/` carries its own `package.json` and installs independently. Root `pnpm install`
does **not** manage its deps; install there separately before running a script.

Reproduce §4's tree verbatim. Node services (`apps/api`) own anything that must not run on a client:
Stripe webhooks, scheduled work, AI, email, push orchestration, health sync, analytics aggregation.

**`docs/` is the design record and is worth reading before changing behavior** — these decisions cost
real effort to reach and are not re-derivable from the code:

| File | Holds |
|------|-------|
| `architecture.md`, `database.md`, `rls.md`, `api.md`, `navigation.md`, `offline.md`, `security.md`, `roadmap.md` | Schema/ERD, RLS policy plan, API + response format, screen inventory, offline strategy |
| `workout-semantics.md` | **Authoritative** PR / e1RM / idempotency semantics |
| `workout-guide-integration.md`, `exercise-mapping.md` | Real package API, asset strategy, **licence compliance** |
| `design-system.md` | Light+dark tokens w/ computed contrast, component contracts, sharing boundary |
| `testing.md` | Test pyramid, §68 flows as given/when/then, CI merge gate |
| `scaffold-handover.md` | Pinned versions + the dependency conflicts already hit |

`packages/ui` shares **tokens and types**; rendered components stay platform-native. §4 L248 is
explicit: do **not** force shared UI where a platform-specific implementation gives better UX.

## Settled semantics — do not silently re-decide these

`docs/workout-semantics.md` wins over any inference from the spec's prose.

- **PR requires strictly greater (`>`)**, never equal. Matching your best is not a record. Bonus:
  makes PR re-detection idempotent for free.
- **PR "highest reps" is scoped per `(exercise, weight)`** — most reps *at that weight*. "Any weight"
  would let 30×20kg permanently outrank 5×100kg. Bodyweight is the `weight IS NULL` bucket.
- **e1RM at `reps = 1` is the weight lifted**, not Epley. Epley degenerates to `w × 1.0333` and
  inflates a genuine single by ~3%, letting a lighter multi-rep set outrank a true max.
- **Every queued/offline write is an UPSERT on a stable client-generated key.** `client_uuid` alone is
  not an idempotency key — it needs `unique(user_id, client_uuid)` on sessions and its own
  `client_uuid` on `session_exercises` (position isn't stable). **`set_number` is client-assigned**,
  not server-incremented; that is what makes retries safe. Offline conflict rule: idempotent upsert +
  last-write-wins by `updated_at`.
- **Account deletion is hybrid**: hard-delete for the account/PII with an RLS-invisible soft grace
  window; content (e.g. custom exercises) stays soft-deleted. This resolves a real §87-vs-§90 tension.
- A Workout Guide sync must **only ever touch `source = workout_guide` rows, never user data** —
  enforced as an RLS policy/constraint, not by trusting the importer.

## Exercise library — `@bryllim/workout-guide` (v1.0.0)

Verified against the package, contradicting §13A's assumptions:

- **302 exercises, exactly 3 frames each = 906 PNG 512×512** — raster, *not* SVG. ~32MB shipped
  inside the package. **Frame count is a constant 3**; don't model it as variable.
- Assets ship in-package and default to a jsDelivr CDN with a `baseUrl` override, so **offline is just
  bundling them** — no download/cache layer or tables needed.
- **Slugs do not encode equipment**: `bench-press`, not `barbell-bench-press`.
- **No `instructions` / `description` / `difficulty` / `aliases` fields exist.** All Gainly-owned and
  **empty at import**, so exercise detail needs a real designed empty state.
- An undocumented `isStretch` boolean exists (14 stretches). `normalizeSearchText` is exported and
  reusable for alias normalization.

### ⚠️ Licensing — binding, and blocking at review

Package **code is MIT, but all 906 images are CC BY-SA 4.0** (copyleft + attribution).
Commercial redistribution is permitted; two obligations are not optional:

1. **Ship images verbatim and tint at render time** (`expo-image` `tintColor`, CSS `filter`).
   **Never pre-bake a recoloured or otherwise modified Workout Guide frame into the build** —
   ShareAlike would force that derivative to stay CC BY-SA 4.0 and bar proprietizing it. If you find
   yourself adding an image-transform step over WG frames, stop.
2. **The attribution screen is in MVP scope** — `Settings > About > Open Source Licenses`, crediting
   **Bryl Lim** and **Everkinetic** (76 derived frames). It is a legal requirement, so it does not get
   cut when scope is squeezed. `docs/workout-guide-integration.md` defines its contents.

This constrains WG imagery only. `../Gainly-logo.png` is first-party; brand derivatives are fine.

## Brand assets

Generated into `packages/ui/assets/brand/` by `scripts/generate-brand-assets.mjs` — **edit the source
logo and re-run rather than hand-editing outputs.** The source `../Gainly-logo.png` is `1254×1254`
RGB with **no alpha** (white background baked in) and is a **lockup including the wordmark**, so:
transparency must be keyed out for dark surfaces, and the app icon uses the **mark alone**,
tight-cropped — the wordmark is illegible below ~120px. The iOS 1024 store icon is the one asset that
must stay **opaque**; Apple rejects alpha there.

## Conventions that matter

- **Dark mode is a requirement (§31), not a toggle.** Define both themes together — retrofitting dark
  is how palettes break. Note white-on-`#4ADE80` fails WCAG AA, so dark-mode button labels use a
  base-on-green pairing.
- Every phase runs **Plan → Implement → Typecheck → Lint → Test → Fix → Review** (§103 L3253).
- **No placeholder TODOs for core functionality** (§103 L3273), and **no "it works" without a test or
  observed output** (§103 L3275).
- Don't put structured application data in large JSON columns without a clear reason (§3 L169). Use
  real FKs, constraints, and indexes.
- **RLS cross-user isolation is the highest-severity bug class here** — silent and unrecoverable. It
  gets tested at two layers on purpose (pgTAP + two real authenticated `supabase-js` clients).
- `.env.example` only, never a real `.env`. Distinguish the client-safe anon key from the server-only
  service-role key.
