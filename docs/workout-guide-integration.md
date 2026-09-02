# Workout Guide Integration Assessment

**Package:** `@bryllim/workout-guide@1.0.0` (npm, published, installable — no access blocker)
**Assessment scope:** recon only. No adapter/importer written; no `npm install` run. Grounded in the on-disk copy at
`C:\Users\ResolutAI\Documents\assisted-living\node_modules\@bryllim\workout-guide` (an unrelated project, read-only).
Every API claim below is cited to a file I actually read.

> Sibling doc: [`exercise-mapping.md`](./exercise-mapping.md) — catalog→Gainly mapping, taxonomy, import strategy.

---

## ⚠️ LICENSE CONSTRAINT — READ FIRST (product/legal decision needed)

**The code is MIT. The 906 exercise images are CC BY-SA 4.0 — a copyleft, attribution-required license. This is a real product constraint, not a formality.**

Cited: `package.json` (`"license": "SEE LICENSE IN LICENSES.md"`), `LICENSES.md`, `LICENSE` (MIT), `LICENSE-ASSETS` (CC BY-SA 4.0), `ATTRIBUTION.md`, and per-frame `attribution.license: "CC BY-SA 4.0"` in `manifest.json`.

What CC BY-SA 4.0 obliges us to do if we ship the artwork (and we plan to bundle it):

1. **Attribution UI is MANDATORY, not optional.** Every distribution must credit the creator (**Bryl Lim**, https://bryllim.com), link the license (https://creativecommons.org/licenses/by-sa/4.0/), and indicate that changes may have been made. The prompt already anticipates this screen (§13A L1144–1152: *Settings → About Gainly → Open Source Licenses → Workout Guide / Exercise Artwork Attribution*). It must exist before ship.
2. **76 frames additionally require crediting Everkinetic.** 76 of 302 first-pose (`frame-1`) images are rasterized adaptations of https://github.com/everkinetic/data (also CC BY-SA 4.0). Exact upstream SVG URLs are in `manifest.json` per-frame `attribution.source.url`. Those 76 need a second credit line.
3. **ShareAlike (the sharp edge): if Gainly *modifies* a Workout Guide image, that modified image must itself be licensed CC BY-SA 4.0** — it cannot become proprietary Gainly content. Recoloring for dark mode, compositing into a branded card that is then exported/redistributed as an image, re-rendering frames into a sprite sheet you ship — all produce derivatives that inherit CC BY-SA 4.0.
4. **Mere aggregation is fine.** Bundling the unmodified PNGs alongside Gainly's proprietary code/other assets does **not** force Gainly's app or other assets to become CC BY-SA. SA is triggered by adapting *the images themselves*, not by shipping them next to proprietary code.
5. **Metadata is free.** Names, muscles, equipment, types, slugs, the manifest structure — these are MIT (and largely uncopyrightable facts). Gainly may normalize, store, and relicense the metadata freely. Only the **image bytes** carry CC BY-SA.

**Bottom line for the human:** CC BY-SA 4.0 explicitly permits commercial use and redistribution, so this is **not a blocker** — but it **mandates an attribution screen** and it means **we must avoid baking WG art into proprietary composite images** (or accept copyleft on those composites). Recommended human decisions:
- (a) Confirm we ship the images **verbatim** (tint via CSS/`tintColor` at render time, which is arguably not creating a distributed derivative) rather than pre-baking recolored PNGs.
- (b) Approve building the attribution screen as an MVP requirement.
- (c) Confirm we will not relicense the artwork as proprietary (prompt §13A L1156 forbids this anyway).

Everything below assumes the above is honored.

---

## 1. Real package API surface

Cited from `dist/index.d.ts` (verbatim types) and verified at runtime against `dist/index.js` / `dist/index.cjs`.

### Types
```ts
type ExerciseType =
  | 'weight_reps' | 'bodyweight_reps' | 'duration'
  | 'distance_duration' | 'assisted_bodyweight';

type Exercise = {
  id: string;                 // e.g. "exercise-bench-press"  (slug prefixed with "exercise-")
  slug: string;               // e.g. "bench-press"           (does NOT encode equipment)
  name: string;               // e.g. "Bench Press"
  exerciseType: ExerciseType;
  equipment: string;          // free-form string, e.g. "Barbell" (17 distinct values, see mapping doc)
  primaryMuscle: string;      // e.g. "Chest" (20 distinct)
  secondaryMuscles: string[]; // e.g. ["Triceps","Shoulders"] (22 distinct)
  isStretch: boolean;
  frames: [ExerciseFrame, ExerciseFrame, ExerciseFrame]; // ALWAYS exactly 3
  attribution: ExerciseAttribution;
};

type ExerciseFrame = {
  index: 1 | 2 | 3;
  path: string;               // "assets/bench-press/frame-1.png" (package-relative)
  width: 512; height: 512; format: 'png';
  attribution: ExerciseAttribution;
};

type ExerciseAttribution = {
  creator: 'Bryl Lim'; creatorUrl: 'https://bryllim.com';
  license: 'CC BY-SA 4.0'; licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/';
  source?: { name: 'Everkinetic'; url: string; license: 'CC BY-SA 4.0'; licenseUrl: string; changes: string };
};

type ExerciseSearchFilters = {
  equipment?: string | readonly string[];
  primaryMuscle?: string | readonly string[];
  exerciseType?: ExerciseType | readonly ExerciseType[];
  isStretch?: boolean;
};

type AssetUrlOptions = { baseUrl?: string; version?: string };
```

### Functions
```ts
declare const exercises: Exercise[];                              // the full 302-entry catalog
declare function normalizeSearchText(value: string): string;
declare function getExercise(idOrSlug: string): Exercise | null;
declare function searchExercises(query?: string, filters?: ExerciseSearchFilters): Exercise[];
declare function getAssetUrl(idOrSlug, frameIndex: 1|2|3, options?: AssetUrlOptions): string | null;
```

### Verified runtime behavior (grounded in `dist/index.js` source + live probe)
- **`exercises` is byte-for-byte identical to `manifest.json`.** Verified: `JSON.stringify(exercises) === JSON.stringify(manifest)` → `true`. So `import { exercises }` and `import manifest from '.../manifest.json'` are interchangeable. **The importer should read `exercises` (typed) rather than re-parse the manifest.**
- **`getExercise(idOrSlug)`** resolves **id first, then slug** (`exercisesById.get(x) ?? exercisesBySlug.get(x) ?? null`). Both `getExercise('bench-press')` and `getExercise('exercise-bench-press')` return the Bench Press object; unknown → `null` (never throws). → Either `external_id` or `external_slug` is a valid resolution key.
- **`normalizeSearchText(v)`** = `v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')`. Diacritic-stripping, `&`→`and`, non-alphanumeric→space, collapse. `"  Púll-Up BAR  "` → `"pull up bar"`. **Reuse this verbatim for Gainly's `normalized_alias` / `normalized_name` so Gainly-side matching is identical to package-side matching.**
- **`searchExercises(query, filters)`**: applies filters first (equipment / primaryMuscle / exerciseType / isStretch), then AND-token match. Filter matching is itself normalized (`normalizeSearchText(candidate) === normalizeSearchText(value)`), so `{equipment:'dumbbell'}` matches `"Dumbbell"`. Query is tokenized and **every** token must be a substring of the normalized haystack `name + equipment + primaryMuscle + secondaryMuscles`. Empty query + no filters → returns all 302. **The query haystack is `name + equipment + primaryMuscle + secondaryMuscles` only — it does NOT include `slug` or `exerciseType` text.**
- **`getAssetUrl(idOrSlug, frameIndex, {baseUrl, version})`** (exact source):
  ```js
  const version = options.version ?? '1.0.0';
  const baseUrl = options.baseUrl ?? `https://cdn.jsdelivr.net/npm/@bryllim/workout-guide@${version}/`;
  return new URL(frame.path, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/').toString();
  ```
  - Default (no options): `https://cdn.jsdelivr.net/npm/@bryllim/workout-guide@1.0.0/assets/bench-press/frame-1.png` — **jsDelivr CDN, not GitHub.**
  - With `{baseUrl:'https://cdn.x.com/wg'}`: `https://cdn.x.com/wg/assets/bench-press/frame-1.png`. **`version` is ignored once `baseUrl` is set** (version only interpolates into the default jsDelivr URL).
  - Bad exercise → `null`. Bad frame index (e.g. `9`) → `null`. Never throws.
  - **This is the seam for pointing at our own asset host** (Supabase Storage / our CDN): pass our bucket base URL as `baseUrl`.

---

## 2. Where the REAL API contradicts the prompt's assumed API

This is the highest-value part of the assessment — the prompt was written from expectation; the package is truth.

| # | Prompt assumption (cite) | Reality (cite) | Consequence for Gainly |
|---|---|---|---|
| D1 | `external_slug = "barbell-bench-press"` — slug encodes equipment (§13A L771) | `slug = "bench-press"`; equipment is a **separate** field. `id = "exercise-bench-press"`. (`manifest.json[0]`, `index.d.ts`) | Import/dedup must **not** expect equipment-qualified slugs. Store equipment separately. `external_id` = `"exercise-<slug>"`, `external_slug` = `"<slug>"`. |
| D2 | "Do not store giant **SVG**/image content in PostgreSQL" (§13A L1035) | Assets are **PNG raster**, 512×512, exactly 3 per exercise, 906 total, **32 MB** on disk (`assets/*/frame-{1,2,3}.png`). No SVG ships. | "Don't store in PG" advice still correct, but the SVG assumption is wrong — plan for PNG bundling/CDN, not SVG inlining. (Original Everkinetic SVGs exist upstream but are **not** in this package.) |
| D3 | "Do not depend on remote **GitHub** URLs" (§13A L708) | `getAssetUrl` default host is **jsDelivr CDN**, and — more importantly — **all assets ship *inside* the npm package** (`assets/` dir, subpath export `./assets/*`). (`package.json` exports, `assets/` listing) | Offline is trivially achievable by **bundling the package's local PNGs**; no remote URL of any kind is required for core usage. GitHub is never in the path. |
| D4 | Exercise has `description` + `instructions`; Exercise Details shows Instructions (§13 L572–573, §13A L896) | `Exercise` type has **no** `description`/`instructions` field. (`index.d.ts`) | Instructions are **100% Gainly-owned**. Import seeds them empty; supply later (§96 step 6). |
| D5 | Aliases are importable from Workout Guide; search includes aliases (§13A L1005–1031, L919) | Package ships **zero** alias data. (No alias field in `index.d.ts`/manifest) | `exercise_aliases` is entirely Gainly-owned. Import seeds **no** aliases. Reuse the package's `normalizeSearchText` for `normalized_alias`. |
| D6 | Exercise has `difficulty` (§13 L576) | No `difficulty` field. (`index.d.ts`) | Gainly-owned; import leaves null. |
| D7 | `asset_frame_count` is variable per exercise (§13A L1048) | `frames` is a **fixed 3-tuple** (`[Frame,Frame,Frame]`). All 302 have exactly 3. | `asset_frame_count` is the constant `3` for every WG exercise. Still store it (custom/user exercises may differ). |
| D8 | (not mentioned) | `isStretch: boolean` exists; **14** exercises are stretches. (`manifest.json`) | Free signal for a "Stretch/Mobility" category/filter. Map to a Gainly `is_stretch` flag. |
| D9 | Muscle groups: Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quadriceps, Hamstrings, Glutes, Calves, Abdominals, Lower Back, Traps, Full Body, Cardio, Other (§13) | WG uses **Core, Quads, Lats, Upper Back, Rear Delts, Posterior Chain, Mobility, Legs, Adductors, Hips, Grip, Groin** — several with **no** Gainly equivalent. (see mapping doc) | `mapMuscleGroup()` is mandatory and several map lossily or to `Other`. Details in `exercise-mapping.md`. |
| D10 | Equipment: …Smith Machine, EZ Bar, Trap Bar, Cardio Machine… (§13) | WG uses **Pull-up Bar, Wall, Towel, Plate, Doorway, Box, Bench, Chair, Stability Ball** — none in Gainly's list. Gainly's Smith Machine/EZ Bar/Trap Bar are **unused** by WG. | `mapEquipment()` → many WG values fall to `Other` + warning (§13A L1003). Details in mapping doc. |
| D11 | (assumed lookup by slug) | `getExercise` accepts **both** id and slug, id-first. | Either external key resolves; no ambiguity. |

None of these are integration blockers. D1, D4, D5, D9, D10 change the **importer/schema** and are handed to Jan via the mapping doc.

---

## 3. Adapter design (assessment — implementation deferred to a later task)

Honors §13A L710–745 (adapter isolates the rest of Gainly from the package) and L1214–1236 (removing WG must not destroy the workout system).

```
Gainly Exercise Service (owns UUIDs, history, sets, PRs, templates)
        │  depends only on Gainly's own repository + DB
        ▼
Workout Guide Adapter        packages/exercises/src/workout-guide/
  ├─ types.ts     re-export the package's Exercise/ExerciseType (single import point)
  ├─ mapper.ts    mapMuscleGroup(), mapEquipment(), mapExerciseType() — WG → Gainly canonical
  ├─ assets.ts    resolveAssetUrl(slug, frame, {baseUrl}) — thin wrapper over getAssetUrl,
  │               injects Gainly's own asset base URL; returns null-safe fallback signal
  └─ adapter.ts   toGainlyExercise(wgExercise): GainlyExerciseImportRow  (pure, testable)
        ▼
@bryllim/workout-guide   ← the ONLY file tree that imports this package directly
```

Key design rules:
- **The package is imported in exactly one directory** (`workout-guide/`). Everything else depends on Gainly's repository + DB rows. This satisfies the architectural mandate (§13A L1216): delete the adapter and Gainly's DB-resident exercises still work.
- **Import is a build/seed-time operation, not a runtime dependency.** `scripts/import-workout-guide.ts` reads `exercises`, maps, and writes Gainly rows. At runtime the app reads Gainly's DB, not the package's JS — except for **asset resolution**, which may stay a thin runtime call to `getAssetUrl` (or be fully self-hosted; see §4).
- **Adapter functions are pure** → unit-testable without a DB (satisfies §13A L1194–1212 test list: get/search/resolve/missing/mapping).

---

## 4. Asset & media strategy (incl. React Native specifics)

**The catalog:** 302 exercises × 3 frames = **906 PNGs**, 512×512, monochrome-on-transparent, **32 MB** total, laid out `assets/<slug>/frame-{1,2,3}.png`. Subpath export `./assets/*` makes each addressable.

Three viable delivery models (RN/Expo, §13A L698–708):

1. **Bundle-in-app (recommended for offline core).** Ship the 906 PNGs in the Expo asset bundle. 32 MB is acceptable for a fitness app. Metro can't glob a node_modules asset tree by variable path, so the import script should **copy `assets/` into the app** (e.g. `assets/exercises/<slug>/frame-N.png`) and generate a static `require()` map keyed by `slug` → the three `require()`s. Literal `require()` is the only Metro-reliable way to reference a bundled image by a known path (§13A L703). Fully offline; no network. **Verify in a production build, not just dev** (§13A L705) — Metro dev server resolves paths dev-only that fail in release.
2. **Self-hosted CDN / Supabase Storage.** Upload the 906 PNGs once to our bucket; at runtime call `getAssetUrl(slug, frame, { baseUrl: OUR_BUCKET_URL })`. Smaller app binary, needs network on first view, cache with `expo-image` (disk cache) for offline-after-first-load. **This is a redistribution of the CC BY-SA artwork → attribution obligation applies (see top).**
3. **jsDelivr default (dev/prototyping only).** `getAssetUrl(slug, frame)` → jsDelivr. **Do not ship this as the core path** (§13A L708 spirit): third-party CDN availability is not our SLA, and it's still redistribution requiring attribution.

**Recommendation:** Model **1 (bundle)** for the core offline experience the prompt demands (§13A L706, L1053–1067), with the import script emitting a static `require()` map. Keep `getAssetUrl` + `baseUrl` available as the seam for an optional CDN mode later. Either way, tint at render time (`expo-image` `tintColor` / CSS `filter`) for light/dark rather than pre-baking recolored derivatives (keeps us clear of ShareAlike — see top).

**Fallback illustration behavior (§13A L1069–1080):** the adapter's `resolveAssetUrl` returns `null` for unknown slug/frame (verified: `getAssetUrl` returns `null`, never throws). The `<ExerciseIllustration>` component must render a Gainly fallback graphic on `null` **and** on image load error — never a broken-image icon, empty layout, or crash. Since all 302 WG exercises are guaranteed 3 valid frames, the fallback path is exercised mainly by **user/custom exercises** (source `user`) that have no WG asset.

---

## 5. Offline metadata strategy (§13A L1053–1067)

- **Metadata is tiny and MIT** — cache freely. The per-exercise row Gainly needs offline (id, name, equipment, muscles, exerciseType, selected illustration key, previous values) is a few hundred bytes; 302 rows is trivial to hold in the on-device store (SQLite/MMKV).
- **The import writes metadata into Gainly's DB**, so "offline metadata" is just "Gainly's normal local DB cache" — no dependency on the package at runtime for metadata.
- **Illustrations offline** = asset model 1 (bundled) or model 2 with `expo-image` disk cache primed on first view. Workout completion must never depend on network (§13A L1067) → bundle the frames for any exercise that can appear in an active workout, or pre-warm the cache when a template/program is added.
- `asset_frame_count = 3` and `asset_key = slug` are enough to reconstruct all three frame paths offline without the package (`assets/<asset_key>/frame-{1,2,3}.png`).

---

## 6. License + Attribution compliance checklist (concrete, quoting actual terms)

Sources read: `LICENSE`, `LICENSE-ASSETS`, `LICENSES.md`, `ATTRIBUTION.md`, `README.md`, `package.json`, per-frame `attribution` in `manifest.json`.

| ✔ | Obligation | Exact term / source | Where it lands in Gainly |
|---|---|---|---|
| ☐ | Ship the code license text | `LICENSE` (MIT): *"The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."* | `docs/THIRD_PARTY_LICENSES.md` (§13A L1141) includes MIT text + `Copyright (c) 2026 Bryl Lim`. |
| ☐ | Ship the asset license + credit creator | `LICENSE-ASSETS` (CC BY-SA 4.0): *"provided that you give appropriate credit, link to the license, indicate changes, and distribute adaptations under the same license."* | Attribution screen: **"Exercise artwork © 2026 Bryl Lim (bryllim.com), licensed CC BY-SA 4.0"** + link `https://creativecommons.org/licenses/by-sa/4.0/`. |
| ☐ | Credit Everkinetic for the 76 derived frames | `ATTRIBUTION.md`: *"Seventy-six first-pose frames are rasterized adaptations of artwork from Everkinetic … licensed under CC BY-SA 4.0."* Per-frame `attribution.source.url` in manifest lists exact source SVGs. | Second credit line: **"Certain poses adapted from Everkinetic (github.com/everkinetic/data), CC BY-SA 4.0."** |
| ☐ | Indicate changes | `manifest.json` frame-1 `attribution.source.changes`: *"Rasterized on a transparent 512 × 512 canvas and recolored for monochrome display."* | Note "adapted (rasterized/recolored)" on the attribution screen. If Gainly tints for dark mode at runtime, that's arguably not a distributed change; if we pre-bake, disclose it. |
| ☐ | Honor ShareAlike on any image derivative we distribute | `LICENSE-ASSETS`: *"distribute adaptations under the same license."* | **Do not relicense WG art as proprietary** (§13A L1156). Prefer render-time tint over baked derivatives. Any shipped derivative image → CC BY-SA 4.0. **← human sign-off.** |
| ☐ | Review both license parts before redistribution | `package.json`: `"license": "SEE LICENSE IN LICENSES.md"`; `LICENSES.md`: *"consumers review both parts before redistribution."* | Done in this assessment; carry into `docs/WORKOUT_GUIDE.md` (§13A L1163). |
| ☐ | Build the attribution UI | §13A L1144–1152 | Settings → About Gainly → Open Source Licenses → Workout Guide / Exercise Artwork Attribution. **MVP requirement, not post-ship.** |

**Verdict:** redistribution is **permitted** (CC BY-SA 4.0 allows commercial share + adapt). It is **conditioned** on the attribution UI and on not proprietizing image derivatives. No clause forbids redistribution. The one item needing a human product/legal call is the ShareAlike posture (row 5) — flagged to god / escalate to Michael.

---

## 7. Known limitations (for `docs/WORKOUT_GUIDE.md` later)

- No instructions, descriptions, difficulty, aliases, or video in the package — all Gainly-owned.
- 302 exercises only; Gainly must supplement (§96 L3042). Notable gaps are a product review, not part of this recon.
- WG muscle/equipment taxonomies don't match Gainly's — lossy mapping required (see `exercise-mapping.md`).
- Assets are monochrome line art (not photos/video); acceptable for illustration, not for form-check video.
- Version pinned at `1.0.0`; upgrades require re-running import validation + license re-check (§13A L1180–1192).
