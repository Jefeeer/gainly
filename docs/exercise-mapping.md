# Exercise Mapping Plan — Workout Guide → Gainly

**Source:** `@bryllim/workout-guide@1.0.0`, 302 exercises (`exercises` export ≡ `manifest.json`, verified byte-identical).
**Companion:** [`workout-guide-integration.md`](./workout-guide-integration.md) — API surface, assets, license.
**Ownership note for Jan:** this doc specifies the **exercise-domain** columns and mapping tables the import needs. It does **not** design the whole schema — Jan owns that. Columns below are requirements to integrate, not a final DDL.

All counts below are from a direct scan of `manifest.json` (Node, not the prompt).

---

## 1. Catalog shape (measured)

| Dimension | Values |
|---|---|
| Total exercises | **302** (0 duplicate slugs, 0 duplicate names — normalized) |
| Frames each | **exactly 3** (906 PNGs total, 512×512) |
| `isStretch: true` | **14** |
| First-pose frames w/ Everkinetic source attribution | **76** |
| `exerciseType` | **5** distinct |
| `equipment` | **17** distinct |
| `primaryMuscle` | **20** distinct |
| `secondaryMuscles` | **22** distinct (union w/ primary = **23** muscle tokens) |

### exerciseType distribution (5)
`weight_reps` 136 · `bodyweight_reps` 114 · `duration` 39 · `distance_duration` 10 · `assisted_bodyweight` 3

---

## 2. Exercise Type mapping (WG → Gainly tracking type)

WG's 5 types are well-designed tracking semantics. **Recommendation: adopt them as Gainly's canonical `exercise_type` / tracking types 1:1** — no lossy mapping needed here, and it directly drives the set-logging UI.

| WG `exerciseType` | Count | Gainly tracking type | UI logs |
|---|---|---|---|
| `weight_reps` | 136 | `weight_reps` | weight × reps |
| `bodyweight_reps` | 114 | `bodyweight_reps` | reps (bodyweight) |
| `duration` | 39 | `duration` | time |
| `distance_duration` | 10 | `distance_duration` | distance + time |
| `assisted_bodyweight` | 3 | `assisted_bodyweight` | assist weight × reps |

If Gainly wants a `weighted_bodyweight` (e.g. weighted pull-ups) it's additive — WG has no such value, so it's Gainly-owned.

---

## 3. Muscle mapping (WG → Gainly canonical) — `mapMuscleGroup()`

Gainly canonical (§13 L593–610): `Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quadriceps, Hamstrings, Glutes, Calves, Abdominals, Lower Back, Traps, Full Body, Cardio, Other`.

WG muscle vocabulary is **23 tokens** (20 primary + 3 secondary-only: Grip, Cardio, Groin). Clean 1:1 for the common ones; several are **lossy or have no Gainly home** (flagged ⚠). `mapMuscleGroup()` is mandatory (§13A L983–997).

| WG muscle | As primary (count) | → Gainly | Note |
|---|---|---|---|
| Chest | 26 | **Chest** | 1:1 |
| Back | 19 | **Back** | 1:1 |
| Shoulders | 22 | **Shoulders** | 1:1 |
| Biceps | 13 | **Biceps** | 1:1 |
| Triceps | 17 | **Triceps** | 1:1 |
| Forearms | 5 | **Forearms** | 1:1 |
| Quads | 35 | **Quadriceps** | rename only |
| Hamstrings | 16 | **Hamstrings** | 1:1 |
| Glutes | 38 | **Glutes** | 1:1 |
| Calves | 9 | **Calves** | 1:1 |
| Core | 45 | **Abdominals** | rename (WG "Core" = Gainly "Abdominals") |
| Lower Back | 3 | **Lower Back** | 1:1 |
| Lats | 15 | **Back** | ⚠ lossy — Gainly has no Lats; folds into Back |
| Upper Back | 9 | **Back** | ⚠ could be Traps; default Back, admin can retag |
| Rear Delts | 4 | **Shoulders** | ⚠ lossy — folds into Shoulders |
| Legs | 14 | **Full Body** *(decision)* | ⚠ ambiguous umbrella; see D-M1 |
| Posterior Chain | 4 | **Full Body** *(decision)* | ⚠ no Gainly equiv; see D-M2 |
| Mobility | 4 | **Other** | ⚠ no equiv (mobility/stretch); pairs with `isStretch` |
| Adductors | 2 | **Other** *(decision)* | ⚠ no equiv; see D-M3 |
| Hips | 2 | **Glutes** | ⚠ lossy — nearest is Glutes |
| Grip | (2nd only) | **Forearms** | secondary-only |
| Cardio | (2nd only) | **Cardio** | secondary-only; 1:1 |
| Groin | (2nd only) | **Other** | ⚠ = Adductors → Other |

**Every ⚠ row that hits `Other` or a lossy fold must emit an import warning** (§13A L977 "Unsupported muscle groups").

Gainly groups **unused** by WG-as-primary: `Traps` (only via Upper Back retag), `Full Body` (only if we route Legs/Posterior Chain there).

### Decisions for the human / Jan (muscle taxonomy)
- **D-M1 (Legs, 14 exercises):** WG "Legs" is a lower-body umbrella (squat-pattern). Gainly has no umbrella. Options: (a) map → `Full Body` [chosen default], (b) map → `Quadriceps` (dominant mover, but drops ham/glute), (c) add a Gainly `Legs`/`Lower Body` group. **Recommend (c) if product wants a lower-body filter; else (a) with warning.**
- **D-M2 (Posterior Chain, 4):** deadlift-family. Options: `Full Body` [default], `Back`, or add group. Warn either way.
- **D-M3 (Adductors/Hips/Groin, ~6 total):** no Gainly equivalent. Default `Other`+warning; consider a Gainly `Adductors` group if product cares about it.

These are taxonomy calls, not blockers — the mapping table ships with safe defaults + warnings, and admin retag (§13A L1102–1122) fixes individuals.

---

## 4. Equipment mapping (WG → Gainly canonical) — `mapEquipment()`

Gainly canonical (§13 L612–625): `Barbell, Dumbbell, Machine, Cable, Bodyweight, Smith Machine, Kettlebell, Resistance Band, EZ Bar, Trap Bar, Cardio Machine, Other`.
Rule (§13A L1003): **unknown → `Other` + import warning.**

| WG equipment | Count | → Gainly | Note |
|---|---|---|---|
| Bodyweight | 111 | **Bodyweight** | 1:1 |
| Dumbbell | 45 | **Dumbbell** | 1:1 |
| Machine | 35 | **Machine** | 1:1 |
| Barbell | 29 | **Barbell** | 1:1 |
| Cable | 26 | **Cable** | 1:1 |
| Resistance Band | 19 | **Resistance Band** | 1:1 |
| Kettlebell | 2 | **Kettlebell** | 1:1 |
| Cardio | 13 | **Cardio Machine** | ⚠ some "Cardio" is bodyweight (jumping jacks); default Cardio Machine, warn |
| Pull-up Bar | 7 | **Other** *(decision)* | ⚠ not in Gainly list; see D-E1 |
| Wall | 3 | **Other** | ⚠ → Other + warning |
| Towel | 3 | **Other** | ⚠ → Other + warning |
| Plate | 2 | **Other** | ⚠ (or Barbell? distinct movement) → Other + warning |
| Doorway | 2 | **Other** | ⚠ → Other + warning |
| Box | 2 | **Other** | ⚠ → Other + warning |
| Bench | 1 | **Other** | ⚠ → Other + warning |
| Chair | 1 | **Other** | ⚠ → Other + warning |
| Stability Ball | 1 | **Other** | ⚠ → Other + warning |

**~22 exercises** fall to `Other` (Pull-up Bar 7 + Wall/Towel/Plate/Doorway/Box/Bench/Chair/Stability Ball 15). All emit warnings (§13A L976 "Unsupported equipment types").

Gainly equipment **unused** by WG: `Smith Machine`, `EZ Bar`, `Trap Bar` (reserved for Gainly-native/custom exercises).

- **D-E1 (Pull-up Bar, 7):** common enough to deserve its own group. **Recommend adding `Pull-up Bar` to Gainly equipment** rather than dumping 7 pull/chin exercises into `Other`. Human/Jan call.

---

## 5. Aliases — Gainly-owned (WG ships none)

The package has **no alias data** (verified — no field in `index.d.ts`/manifest). So (contra §13A L1005–1031 which reads as if aliases were importable):
- Import seeds **zero** aliases.
- `exercise_aliases` is fully Gainly-owned; populate manually/admin (§13A L1116) over time (e.g. "Romanian Deadlift" → RDL, Barbell RDL).
- **Reuse the package's `normalizeSearchText()`** (see integration doc §1) to compute `normalized_alias` and `normalized_name`, so Gainly-side alias matching is identical to package-side search normalization. One normalizer, no drift.

---

## 6. Duplicate detection (§13A L929–940)

Within the WG catalog: **0 duplicate slugs, 0 duplicate names** (measured) — so intra-WG import is clean. Duplicates arise only against **Gainly-native / user** exercises. Matching rules, in priority order:

1. **`external_source + external_slug`** (exact, authoritative) — re-import of the same WG exercise updates in place, never duplicates. This is the idempotency key.
2. **`normalized_name`** (via `normalizeSearchText`) — catches a Gainly-native "Bench Press" vs WG "Bench Press". On match → **flag as duplicate candidate, do NOT auto-merge** (§13A L940).
3. **Known aliases** — if a WG normalized name matches a Gainly alias → duplicate candidate.
4. **Manual admin mappings** — admin resolves ambiguous candidates (§13A L938).

Never auto-merge ambiguous matches; surface them in the import report for admin review.

---

## 7. Import strategy — `scripts/import-workout-guide.ts` (design; DO NOT build this task)

Idempotent seed (§13A L942–964, §96). Reads the typed `exercises` export (not a re-parsed manifest).

1. `import { exercises } from '@bryllim/workout-guide'` → 302 rows.
2. **Validate** each (present slug/name/frames×3/known type). Never silently drop (§13A L981) — invalid → report + skip.
3. **Map** name (verbatim), `mapMuscleGroup(primary + each secondary)`, `mapEquipment`, `mapExerciseType`.
4. **Resolve external keys:** `external_source='bryllim_workout_guide'`, `external_id='exercise-<slug>'`, `external_slug='<slug>'`, `asset_provider='workout_guide'`, `asset_key='<slug>'`, `asset_frame_count=3`.
5. **Upsert by `(external_source, external_slug)`** (rule 1 above). Create if absent; on existing WG-sourced row, update **permitted metadata only** (name, muscles, equipment, type, asset fields).
6. **Never touch `source IN ('user','gainly','admin')` rows** (§13A L961, L1100) — WG sync only owns `source='workout_guide'` (or `'imported'`) rows.
7. **Emit import report** (§13A L966–981).
8. Re-running produces **0 creates, N updates, 0 duplicates** — the idempotency proof.

`is_custom=false`, `is_active=true`, `source='workout_guide'` for all imported rows.

---

## 8. Import report shape (§13A L966–981)

```
Workout Guide import  v1.0.0   <ts>
  discovered:            302
  created:               <n>
  updated:               <n>
  skipped (invalid):     <n>   [+ per-row reason]
  duplicate candidates:  <n>   [Gainly-name collisions, for admin review — not merged]
  mapping warnings:
    muscle → Other/lossy: <n>  [Legs, Posterior Chain, Adductors, Hips, Mobility, Rear Delts, Lats, Upper Back]
    equipment → Other:    ~22  [Pull-up Bar×7, Wall, Towel, Plate, Doorway, Box, Bench, Chair, Stability Ball]
  missing illustrations:  0    [all 302 have 3 valid frames]
  errors:                <n>
```
"Do not silently discard exercises" (§13A L981) — every skip/warn is a line item.

---

## 9. Exercise-domain columns the import needs (hand-off to Jan)

Not a schema — the **minimum** exercise-table columns + one child table the mapping requires. Jan integrates into Gainly's canonical schema; names are suggestions.

**`exercises` (Gainly-owned canonical, per §13 L567–591):**
- `id` uuid (Gainly PK — **never** the external slug, §13A L774–776)
- `name`, `slug` (Gainly's own slug), `description`, `instructions` — **Gainly-owned; WG seeds these empty** (D4)
- `exercise_type` (5 WG values adopted 1:1, §2), `equipment` (canonical), `difficulty` (Gainly-owned, null on import, D6)
- `primary_muscle` (canonical), plus a `secondary_muscles` representation (array col or join table — Jan's call)
- `is_stretch` bool (from WG `isStretch`, D8)
- `source` enum (`gainly|workout_guide|user|admin|imported`), `external_source`, `external_id`, `external_slug`
- `asset_provider`, `asset_key`, `asset_frame_count` (=3 for WG) — **references only, never image bytes in PG** (§13A L1035)
- `image_url` / `local_asset_key`, `video_url` (Gainly-owned)
- `is_custom`, `is_active`, `created_by`, `created_at`, `updated_at`
- **Idempotency:** unique index on `(external_source, external_slug)` where source is WG. This is what makes re-import safe.

**`exercise_aliases` (Gainly-owned, seeds empty from WG):**
- `id`, `exercise_id` fk, `alias`, `normalized_alias` (via `normalizeSearchText`), `created_at`.

**Mapping tables** (`mapMuscleGroup`, `mapEquipment`) live in the **adapter code** (§3), not the DB — they're deterministic functions, version-controlled with the importer. The DB stores only the **already-normalized** canonical values.

---

## 10. Open decisions (escalate)

- **D-M1/D-M2/D-M3** — muscle taxonomy gaps (Legs, Posterior Chain, Adductors/Hips/Groin). Safe defaults chosen; product may want new Gainly groups.
- **D-E1** — add `Pull-up Bar` to Gainly equipment (7 exercises) vs dump to `Other`.
- **License ShareAlike posture** — see integration doc top; product/legal sign-off before shipping artwork.

None block the import design; all have safe defaults that emit warnings.
