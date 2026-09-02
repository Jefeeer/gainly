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
