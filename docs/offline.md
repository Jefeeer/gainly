# Gainly — Offline Strategy (`offline.md`)

Owner: Jan. Covers §103 item 11. Sources: §39 (L1764), §37 (L1721), §38 (L1739), §53 (L2060),
§82 (L2825), §83 (L2835). Priority §101: correctness > **data integrity** — offline must never
corrupt or duplicate a workout.

---

## 1. Scope: offline is about the **active workout** (§39, §53)

§39 (L1766) scopes offline resilience to **workout logging** — an active workout must survive
backgrounding, app close, connectivity loss, and (where possible) crash (§39 L1775). Gainly is
**not** a fully offline-first CRDT app; it is **local-first for the one flow that happens in a
gym with bad signal**. Everything else (history, progress, nutrition) uses TanStack Query's
normal cache + retry (§38) and simply shows a stale/loading state offline.

---

## 2. Three layers

### Layer A — In-memory active-workout store (Zustand, §37 L1727)
The active workout, its exercises, sets, and rest-timer state live in Zustand as the **source of
truth while training**. The UI reads/writes here with zero network dependency — this is what
makes set entry instant (§53 L2060, §82 L2827).

### Layer B — Durable local persistence (survives restart/crash, §39 L1773)
The Zustand active-workout slice is persisted to device storage on every mutation (debounced),
so a killed/crashed app rehydrates the exact in-progress session on next launch.
- Store: **`expo-sqlite`** (or MMKV for the draft blob) — NOT plain AsyncStorage for the draft.
  (Auth tokens go in SecureStore, `security.md` §Token — separate concern.)
- Key: `active_workout_draft:{userId}`. Holds the full session tree + a `client_uuid`.
- On launch, root layout checks for a draft → offers **Resume** (surfaced as the banner in
  `navigation.md §3`).

### Layer C — Sync queue (queued synchronization, §39 L1771)
Writes to the server are **queued**, not inline. A persisted FIFO queue of mutations
(`create_session`, `upsert_set`, `finish_session`, …) drains when connectivity returns
(NetInfo listener + TanStack Query `onlineManager`).
- Each queued op carries the `client_uuid` / stable child keys so replays are **idempotent**
  (`api.md §5`): re-sending a set with the same `(session_exercise_id, set_number)` upserts, not
  duplicates.
- Queue drains on: reconnect, app foreground, and immediately after `finish`.

---

## 3. Conflict-safe updates (§39 L1772)

Gainly's data shape makes conflicts rare and resolvable without CRDTs:
- A workout session is **owned and edited by one user on one active device** at a time. There is
  no concurrent multi-writer on the same session in MVP.
- **Idempotent upserts** keyed by stable client-generated ids (reconciled with Dwight D1/D2):
  `unique(user_id, client_uuid)` on sessions, `client_uuid` on `session_exercises`
  (`(session_id,position)` isn't stable — position mutates on reorder), and
  `(session_exercise_id, set_number)` on sets with a **client-assigned, retry-stable
  `set_number`**. Replay resolves to the same row (`api.md §5`, `409 CONFLICT` → canonical row).
- **Session metadata (notes/name) is last-write-wins by `updated_at`** (decision D-d,
  `database.md §13`): the server applies an incoming write only if
  `incoming.updated_at >= stored.updated_at`; a queued write that is **older** than the row
  already on the server is **dropped**, not applied — this is what stops a stale queued write from
  clobbering a newer edit made from elsewhere before the queue drained. Scoped to the single
  active device (below) — acceptable because there is no second concurrent editor to actually
  race against.
- Finish is idempotent: re-finishing returns the same computed metrics (`api.md §5`).

`ponytail:` single-active-device assumption is the deliberate ceiling. Upgrade path if
multi-device concurrent editing is ever needed: per-set `updated_at` vector + server merge. Not
built now (YAGNI, §39 only asks for "conflict-safe", which idempotent keys satisfy).

---

## 4. Optimistic UI (§83, §82)

- Set completion, add/remove set, add exercise all apply optimistically to the Zustand store and
  enqueue the server write (§83 L2835). The UI never blocks on the network during a workout.
- TanStack Query optimistic updates (§38 L1756) cover non-workout mutations (log weight, log
  food, favorite) with rollback on error.
- Previous-performance + exercise metadata are prefetched/cached at workout start so they're
  available offline mid-session (§82 L2829).

---

## 5. Recovery flow (§39 L1773)

```text
app launch
  ↓ read active_workout_draft
  ↓ draft exists? ── no ─→ normal home
  ↓ yes
Resume banner → open Active Workout rehydrated from draft (Layer B)
  ↓ connectivity? ── offline ─→ keep training; queue grows (Layer C)
  ↓ online ─→ drain queue idempotently → server state converges
Finish → enqueue finish → on ack: clear draft + invalidate history/progress queries
```

---

## 6. What is explicitly NOT offline (scope guard)
Browsing full history, progress charts, nutrition catalog search, admin — these need the server
and degrade to cached/stale + a clear offline indicator (§85 error states). No attempt to make
the entire app writable offline; that would trade §101 #2 data integrity for breadth we don't
need (§39 is workout-scoped).

**Workout Guide exercise images are not part of this layer at all — they need no download/cache
system.** All 906 frames ship bundled inside the app binary, verbatim, at build time (they are
CC BY-SA 4.0; render-time tinting only, no pre-baked/modified copies — `workout-guide-
integration.md`). There is nothing to fetch offline and nothing to cache: none of Layers A/B/C
above apply to them. Don't add a WG asset cache table on the assumption offline strategy implies
one.

---

## Assumptions & flagged contradictions
- **A1** Persistence engine = `expo-sqlite`/MMKV for the draft; **SecureStore is reserved for
  auth tokens only** (`security.md`). Draft workout data is not a secret, so SQLite/MMKV is
  correct and faster.
- **A2** Single-active-device assumption (§3 above) — the ceiling that lets us skip CRDTs while
  still meeting §39's "conflict-safe". Flagged, not silent.
- **A3** Idempotency keys (reconciled with Dwight, `database.md §13` D-e): `unique(user_id,
  client_uuid)` on sessions, `client_uuid` on `session_exercises`, client-owned `set_number` on
  sets. These are the linchpin of duplicate-free sync; confirm they survive Darryl's migration
  generation.
- No offline-specific contradictions beyond the shared greenfield note (C1).
