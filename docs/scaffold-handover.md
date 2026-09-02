# G-2 Scaffold Handover (Darryl, blocked at token cap)

Status when frozen: apps/web + packages/config + packages/ui reshaped from
create-turbo defaults. apps/mobile, apps/admin, apps/api, packages/{database,
types,validation,analytics,utils,constants,exercises}, supabase/, scripts/
NOT started. No `pnpm install` has been run yet (no node_modules, nothing
verified end-to-end).

## 1. Versions pinned / settled (from create-turbo's own registry lookup, not guessed)

- pnpm `11.23.0` (root `packageManager` field). Locally installed pnpm was
  `11.22.0` — one patch behind. Not yet reconciled; corepack may complain on
  first install, check that first.
- Node `>=24` (root `engines`).
- turbo `^2.10.12`
- typescript `7.0.2`
- eslint `10.9.1`, `@eslint/js` `10.0.1`, `typescript-eslint` `8.68.0`
- Next.js `16.3.2`, React `19.2.8`, `react-dom` `19.2.8`
- Tailwind CSS v4 chosen for apps/web (CSS-first config: `@import "tailwindcss"`
  in globals.css + `@tailwindcss/postcss` in postcss.config.mjs) — **but the
  `tailwindcss` / `@tailwindcss/postcss` devDependencies were never actually
  added to apps/web/package.json.** Config files reference packages that
  aren't declared yet. Fix this before installing.

## 2. Dependency conflicts actually hit

None yet — I never reached apps/mobile (Expo), apps/admin, or apps/api, so no
Expo SDK / React / React Native peer-dep resolution happened in this session.
**Flag, not a finding:** Expo SDK pins its own compatible React version and it
commonly lags the latest React (19.2.8 here). Check the Expo template's own
`package.json` after scaffolding apps/mobile before trying to share any
`packages/*` that both web and mobile import — that's the likely friction
point, not yet confirmed.

## 3. Things tried that did not work

Nothing failed. Everything attempted so far (create-turbo scaffold, file
moves/edits) succeeded. The risk is untested surface area, not known breakage.

## 4. Decisions already baked in

- pnpm workspaces (`pnpm-workspace.yaml`: `apps/*`, `packages/*`), not npm/yarn.
- Consolidated create-turbo's default `packages/eslint-config` +
  `packages/typescript-config` into a single `packages/config` package
  (`@gainly/config`) with subpath exports `./eslint/*` and `./typescript/*.json`
  — because spec §4's tree lists only `packages/config`, not separate
  eslint-config/typescript-config packages. Reproduce the tree verbatim.
- Renamed workspace scope `@repo/*` → `@gainly/*` everywhere it was touched
  (apps/web, packages/ui, packages/config).
- Deleted `apps/docs` (create-turbo's default demo app) — not in spec's tree.
- Renamed the `check-types` script/turbo-task → `typecheck` to match §78's
  `pnpm typecheck` command name. Added a `test` turbo task (was missing).
- apps/web: swapped the create-turbo demo homepage for a minimal stub page,
  wired (not yet installed) for Tailwind v4.
- `gainly/docs/` is intentionally untouched beyond this file — Jan owns it.

## 5. Next 5 steps, in order, once unblocked

1. Add `tailwindcss` + `@tailwindcss/postcss` (latest v4.x, check registry) to
   apps/web devDependencies — config already expects them.
2. Run root `pnpm install` once, read the full output for peer-dep
   warnings/corepack version mismatches before touching anything else.
3. Scaffold apps/admin (`create-next-app`, same Tailwind+TS+ESLint shape as
   web), apps/api (hand-rolled Node/TS, minimal server, no framework unless
   spec needs one), apps/mobile (`create-expo-app` with the Expo Router TS
   template) — take the Expo template's own React/RN versions as given, don't
   force them to match apps/web's React 19.2.8.
4. Hand-build minimal `packages/{database,types,validation,analytics,utils,
   constants,exercises}`: package.json + tsconfig extending
   `@gainly/config/typescript/base.json` + one-line `src/index.ts` stub each.
   These are intentionally stubs at Phase 1 — that's correct here, not debt.
5. `supabase/{migrations,functions,seed}` as empty dirs (`.gitkeep`),
   `scripts/import-workout-guide.ts` stub, root `.env.example` per spec §73,
   then run install + typecheck + lint + build from repo root and fix
   whatever's red before writing SETUP.md with real command output as evidence.

---

## 6. Supabase (G-11, Darryl — local dev + migration harness)

Unfrozen and reassigned to the Supabase layer only (Oscar owns G-2b / app scaffold,
Jan owns schema content, Angela owns pgTAP test content). This section documents the
harness; no schema DDL and no app-scaffold files were touched.

### Pinned tool version

- Supabase CLI `2.116.0`, resolved live via `npx supabase@latest --version` (not
  guessed). **Not yet a devDependency** — I do not own root `package.json` while
  Oscar's G-2b is in flight. Exact line to add, routed via god:
  ```json
  "supabase": "2.116.0"
  ```
  Pinned exact (no `^`), matching how the Supabase project itself recommends
  pinning the CLI — a minor CLI bump can change migration/config behavior.

### Environment gap — no Docker

`supabase start` requires Docker (or Podman) to run the local Postgres/Auth/
Storage/Realtime stack; neither is installed on this machine. Confirmed with the
actual CLI error, not assumed:
```
{"_tag":"Error","error":{"code":"LegacyDockerLifecycleInspectError","message":
"failed to inspect container health: docker: command not found (podman also not
found) — install Docker Desktop or Podman and ensure it is on PATH"}}
```
Everything below that does NOT require a running Postgres (`init`, `migration new`,
config edits) was completed and verified. Everything that DOES require Docker
(`start`, `db reset`, `test db` actually executing) is documented but **not run** —
installing Docker Desktop is a system-level change (admin rights, hypervisor/WSL2,
likely a reboot) I'm not making unilaterally. **Escalated to god/human**, not faked.

### What's on disk

```
supabase/
  config.toml       # from `supabase init`, one edit (see below)
  .gitignore        # from `supabase init` (.branches, .temp, .env.keys, .env*.local)
  migrations/.gitkeep   # empty, ready for Jan's DDL — verified the naming convention
                        # works via a throwaway `supabase migration new harness_smoke_test`
                        # (produced 20260902130642_harness_smoke_test.sql), then deleted it.
  functions/.gitkeep    # empty, ready for Edge Functions (none needed yet)
  seed/.gitkeep         # empty, ready for Jan's seed data
  tests/rls/.gitkeep    # empty, ready for Angela's pgTAP files (testing.md §4.5:
                        # supabase/tests/rls/*.sql)
```

**config.toml edit:** default `[db.seed].sql_paths` is `["./seed.sql"]` (a single
file). Spec §4's tree wants `supabase/seed/` as a *folder*, so changed to
`sql_paths = ["./seed/*.sql"]` — everything Jan/whoever drops under `supabase/seed/`
gets picked up automatically on `db reset`, ordered by filename.

### pgTAP — one thing NOT done, needs Jan

`supabase test db` runs pgTAP files (default picks up anything under
`supabase/tests/`, so `tests/rls/*.sql` is covered with no extra config). But pgTAP
itself needs `create extension if not exists pgtap;` run once against the database.
Per my boundary I do not write schema DDL — `database.md §1` already says Jan's
first migration should do `extensions → enums → lookups → ...`. **Flagging for
Jan:** add `pgtap` alongside `pgcrypto`, `pg_trgm`, `unaccent` in that first
extensions migration, or pgTAP tests will fail to run with a missing-extension
error once Docker is available. Not done here to avoid a second agent writing
migration content.

### The local dev loop (commands, once Docker is present)

```bash
# one-time / after pulling new deps
pnpm supabase start          # boots Postgres+Auth+Storage+Realtime+Studio in Docker
                              # prints local anon key / service_role key / URL — put
                              # those in .env.local, NOT .env.example

# schema iteration
pnpm supabase migration new <name>   # empty timestamped file: YYYYMMDDHHMMSS_<name>.sql
pnpm db:migrate                       # -> `supabase migration up`: applies pending
                                       #    migrations without wiping data
pnpm db:seed                          # -> `supabase db reset`: drops, re-applies every
                                       #    migration from scratch, then runs
                                       #    supabase/seed/*.sql — this is also what CI
                                       #    uses to prove migrations replay cleanly
                                       #    (testing.md §5 CI gate #7)

# tests
pnpm supabase test db                 # runs every *.sql under supabase/tests/ with
                                       # pgTAP (needs the pgtap extension enabled first)

# shutdown
pnpm supabase stop
```

`db:migrate` / `db:seed` script names already exist in root `package.json` (added
by Oscar/god ahead of this card) — I did not touch that file, just confirmed the
commands they wrap are correct for this config.

### Env validation (Zod) — already landed, by Oscar, not me

**Correction while writing this section**: Oscar's `packages/validation/src/env.ts`
(added concurrently under G-2b, see his "Completion (PARTIAL)" note below) already
covers this — one combined `envSchema` including `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, called explicitly
via `parseEnv()` rather than as an import side-effect. I did not write it and am not
touching `packages/validation`. **One gap that schema doesn't cover yet**: it's a
single schema with no split between the server-safe subset and the client-safe
subset, so nothing currently *stops* `SUPABASE_SERVICE_ROLE_KEY` from being pulled
into a mobile/web bundle by accident — `testing.md §4.5` wants that enforced by a CI
grep gate (service-role key string never appears in `apps/mobile`/`apps/web`
bundles), not by the schema shape itself, so this may already be covered depending
on how Angela wires that CI step. Flagging so it isn't assumed solved by the schema
alone.

### Still needs the human (per god, already communicated)

Creating the actual hosted Supabase project (staging/prod) — not attempted, not
faked. Local-only harness above is what CI and every dev machine will use until
that lands.

---

## Completion (PARTIAL — Oscar oscar-mtk34elp, stopped at token cap)

STATUS: tree complete, but pnpm install NEVER RAN. node_modules absent.
typecheck/lint/build are UNVERIFIED. DONE criteria NOT met. The circuit breaker
constrained me at ~2.35M tokens before I could run the single root install.

### On disk (committed)
- Section-4 tree complete: apps/{web,admin,api,mobile}, packages/{ui,config,
  database,types,validation,analytics,utils,constants,exercises}, supabase/
  {migrations,functions,seed} (empty .gitkeep), scripts/import-workout-guide.ts, docs/.
- apps/admin: Next.js, MIRRORS apps/web version set (Next 16.3.2, React 19.2.8,
  Tailwind v4), port 3001. DEVIATION from the create-next-app instruction:
  mirrored web for a consistent version set + zero interactive/install risk.
  Flagged to god for sign-off.
- apps/api: minimal node:http service (no framework), tsc build to dist, /health.
  Starts via node src/index.ts (Node 24 strips TS types).
- apps/mobile: create-expo-app default template, Expo SDK 57. Template aligned
  set (do NOT re-pin): react 19.2.3, react-native 0.86.3, reanimated 4.5.1,
  worklets 0.10.1, typescript ~6.0.3 (repo elsewhere pins TS 7.0.2 - watch hoist
  conflict at install). No build script so turbo build skips mobile (intended;
  native builds go via EAS). No nested .git.
- .npmrc: node-linker=hoisted (Expo/Metro + pnpm monorepo needs flat node_modules).
- Env validation: packages/validation/src/env.ts - Zod schema + parseEnv()
  (explicit call, NOT an import side-effect). Uses z.string().min(1) not .url()
  to dodge zod v3/v4 API churn. zod pinned ^4.0.0 (unverified).
- Root scripts fixed to section-78 names: typecheck (was broken check-types),
  dev:mobile|web|admin|api, test, db:migrate/db:seed to supabase CLI (need
  Supabase CLI + linked project = human step), exercises:import to node script.
- apps/web: added missing tailwindcss + @tailwindcss/postcss devDeps; title Gainly.
- Internal packages are JIT stubs (export raw src .ts, export{} placeholder),
  each with lint + typecheck scripts. Correct for Phase 1, not debt.

### REMAINING STEPS (strict order) for whoever resumes
1. pnpm install at root ONCE. Watch: corepack pnpm 11.22 vs 11.23; TS ~6.0.3
   (mobile) vs 7.0.2 (rest) hoist; react 19.2.3 vs 19.2.8; Expo/RN peer-deps
   under pnpm; zod ^4 resolvability.
2. On failure read FULL error, fix the CAUSE. Do NOT re-run identical install.
3. pnpm typecheck, pnpm lint, pnpm build. Fix reds.
4. Commit + paste ACTUAL command output as evidence (section-103 L3275).

### Unverified assumptions that could bite
- All version pins are from registry lookup / guess - install is the arbiter.
- next typegen used in web+admin typecheck scripts - assumed present in Next 16.
- No transpilePackages added yet (no app imports a workspace TS package today);
  add it the moment an app imports @gainly/ui or another src-exporting package.
---

## 7. Expo SDK 54 trial — before/after version table (G-16, Darryl)

Temporary, revertible. Full reasoning/narrative lives in root CLAUDE.md's "Expo SDK: 54 is a
TEMPORARY trial" section — this table is the mechanical revert data. Resolved via
`npx expo install expo@^54.0.0` then `npx expo install --fix` inside apps/mobile, letting Expo's
own matrix decide every version (nothing hand-picked). SDK 57 baseline is commit `3f0a6ba` and
the isolated baseline-then-downgrade commits made for this trial (see git log). To revert: restore
the `SDK 57` column values into `apps/mobile/package.json` and re-run `pnpm install` — do not
re-derive the peer set from memory, that's the expensive part this table exists to skip.

**`@react-navigation/native` addendum (G-2c, Darryl):** `src/app/_layout.tsx` has always imported
`ThemeProvider`/`DarkTheme`/`DefaultTheme` from `@react-navigation/native`, but it was never a
direct dependency at SDK 57 either — it only resolved transitively via expo-router. Made explicit
at `^7.3.18` (the SDK 54 matrix's version, via `expo install`) as a phantom-dependency fix, not a
version bump. **This means it is not in the table below and reverting to SDK 57 does not restore
it from any prior pin** — after restoring the SDK 57 column, run
`npx expo install @react-navigation/native` again to pick up whatever version the SDK 57 matrix
wants; don't reuse `^7.3.18`.

| Package | SDK 57 (baseline) | SDK 54 (trial) |
|---|---|---|
| expo | ~57.0.19 | ~54.0.37 |
| @expo/ui | ~57.0.15 | ~0.2.0-canary-20260121-a63c0dd |
| expo-constants | ~57.0.17 | ~18.0.14 |
| expo-device | ~57.0.1 | ~8.0.10 |
| expo-font | ~57.0.3 | ~14.0.12 |
| expo-glass-effect | ~57.0.1 | ~0.1.10 |
| expo-image | ~57.0.4 | ~3.0.11 |
| expo-linking | ~57.0.9 | ~8.0.12 |
| expo-router | ~57.0.18 | ~6.0.24 |
| expo-splash-screen | ~57.0.8 | ~31.0.13 |
| expo-status-bar | ~57.0.1 | ~3.0.9 |
| expo-symbols | ~57.0.2 | ~1.0.8 |
| expo-system-ui | ~57.0.3 | ~6.0.9 |
| expo-web-browser | ~57.0.2 | ~15.0.11 |
| react | 19.2.3 | 19.1.0 |
| react-dom | 19.2.3 | 19.1.0 |
| react-native | 0.86.3 | 0.81.5 |
| react-native-gesture-handler | ~2.32.0 | ~2.28.0 |
| react-native-reanimated | 4.5.1 | 4.1.7 |
| react-native-safe-area-context | ~5.7.0 | ~5.6.2 |
| react-native-screens | ~4.26.0 | ~4.16.0 |
| react-native-worklets | 0.10.1 | 0.5.1 |
| @types/react | ~19.2.2 | ~19.1.17 |
| eslint-config-expo | 57.0.2 | ~10.0.0 |
| typescript (mobile only) | ~6.0.3 | ~5.9.3 |

Unchanged by the trial: `react-native-web` stays `~0.21.0` (not part of Expo's native matrix).
`@expo/ui`/`expo-glass-effect` are unused in `src/` at both versions — kept installed at 54
(zero source impact either way, see CLAUDE.md correction). `app.json`'s plugins array gained two
explicit entries (`expo-font`, `expo-web-browser`) that `expo install --fix` auto-registered —
revert by removing those two array entries.

**Known breakage at 54, NOT fixed by me** (outside this card's boundary — source edits, not
config/deps): `expo-router@6.0.24` doesn't export `ThemeProvider`/`DarkTheme`/`DefaultTheme` at
all (verified against its build output), so `src/app/_layout.tsx`'s import of all three resolves
to `undefined` — a boot-time crash, not a type error. Also broken: SF Symbols typing
(`SFSymbols7_0` narrower), `NativeTabTrigger.Label`/`.Icon` missing, `ColorSchemeName` no longer
admits `'unspecified'`. 20 typecheck errors across 6 files total. Routed to Jim as G-19; do not
re-fix here.
