# Gainly — Security Strategy (`security.md`)

Owner: Jan. Covers §103 item 12. Sources: §46 (L1904), §47 (L1927), §34 (L1654), §5 (L282),
§44 (L1886), §45 (L1900), §90 (L2928), §95 (L3019), §65 (L2287). Priority §101 #3 (after
correctness & data integrity). Secure-by-default (§46 L1906).

---

## 1. Trust boundaries (recap `architecture.md §1`)

- **Clients (mobile/web/admin)** hold only the Supabase **anon key** + the user's **JWT**.
  Authorization = **RLS** (`rls.md`). Clients are untrusted.
- **`apps/api` (server)** holds the **service-role key** and all third-party secrets. It is the
  only place RLS is bypassed and the only place secrets exist (§34 L1673, §46 L1923).
- Roles are **server-side** on `profiles.is_admin`; **never trusted from the frontend** (§5
  L297). Admin routes re-check `is_admin()` server-side and write an audit log (§95).

---

## 2. Requirements checklist (§46 L1908) — how each is met

| §46 requirement | Implementation |
|---|---|
| HTTPS only | All endpoints TLS; Supabase + Vercel/host enforce HTTPS; HSTS header. |
| Secure env vars | Secrets in host secret store / EAS secrets; never in repo; `packages/config` validates presence at boot (fail-fast). |
| RLS | Every table enabled+forced, deny-by-default (`rls.md`). |
| Authorization checks | RLS for data; `is_admin()` re-check on every `/admin/*` (`api.md §3`). |
| Input validation | Server-side Zod on every write (§36 L1717, `api.md §4`). |
| Rate limiting | `apps/api` per-IP + per-user limiter on auth, webhooks, search, AI; `429 RATE_LIMITED`. |
| Secure token storage | Mobile SecureStore; web httpOnly cookies (see §3). |
| Refresh token handling | Supabase auto-refresh; refresh token in SecureStore/httpOnly cookie, never JS-readable on web. |
| CSRF protection | Web/admin: SameSite=Lax/Strict cookies + CSRF token on state-changing form posts. Mobile (Bearer header) is not cookie-based → not CSRF-exposed. |
| Content Security Policy | Strict CSP on web/admin (`default-src 'self'`, explicit allowlist for Supabase/PostHog/Sentry/Stripe). |
| Secure headers | HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy via Next.js middleware. |
| Audit logs | `admin_audit_logs` on every admin mutation (§95, `database.md §9`). |

---

## 3. Mobile token storage (§47 L1927)

- Auth access/refresh tokens → **`expo-secure-store`** (Keychain/Keystore-backed). **Never**
  plain AsyncStorage (§47 L1931).
- Supabase client configured with a SecureStore storage adapter for its session.
- Draft workout data (`offline.md`) is **not** a secret → stays in SQLite/MMKV; only auth
  material goes in SecureStore. Clear separation prevents leaking non-secret bulk data into the
  Keychain and vice versa.

### Web/admin token storage
Prefer **httpOnly, Secure, SameSite cookies** for the Supabase session so tokens are not
readable by JS (XSS-resilient). If using supabase-js browser client with local storage,
constrain with strict CSP; cookie-based is the preferred posture for admin.

---

## 4. Secrets & keys inventory (never client-exposed — §46 L1923)

| Secret | Lives in | Never in |
|---|---|---|
| Supabase service-role key | `apps/api` env | mobile/web bundles |
| Stripe secret + webhook signing secret | `apps/api` env | clients |
| PostHog server key, Sentry DSN (server) | `apps/api` env | — |
| Push (FCM server key / APNs auth key) | `apps/api` env | clients |
| AI provider key | `apps/api` env | clients |
| Supabase **anon** key | client bundles (safe by design) | — |

`packages/config` runs env validation (Zod) at startup in every app; a missing/invalid secret
fails the boot rather than running insecurely (§79 Phase 1 "Environment validation" L2580).

---

## 5. Webhook & server hardening
- **Stripe webhooks** (`api.md §3`): verify signature with the signing secret before trusting
  any subscription state; idempotent on Stripe event id (§43). Never mutate `subscriptions`
  from a client.
- Health sync + push registration authenticate the user JWT server-side before writing.
- Generic `500 INTERNAL` responses only — **no stack traces to clients** (§65 L2287); full
  errors go to Sentry (§45) minus passwords/tokens/health data (§45 L1900).

---

## 6. Privacy & data protection (§90, §44)

- Fitness/health data is sensitive (§90 L2930). Users can see what's stored/synced and which
  integrations have access (surfaced in Profile → Privacy / Connected Apps, `navigation.md`).
- **Account/data deletion** (§90 L2938): user-initiated delete → `apps/api` deletes the
  `auth.users` row (service role); FK `on delete cascade` from `profiles` removes all personal
  rows (`rls.md §7`). Soft `deleted_at` provides a grace window.
- **Analytics minimization** (§44 L1886): PostHog/`analytics_events` receive event names +
  non-sensitive props only — no weights, measurements, food, or health payloads. Sentry scrubs
  PII/health before send (§45).
- Health permissions are least-privilege (§27 L1514, §28 L1532): request only scopes for
  enabled features; stored in `health_connections.scopes`.

---

## 7. Threat coverage summary (DONE gate)
- **Cross-user data access** → RLS deny-by-default on every table (`rls.md`), primary control.
- **Privilege escalation** → `is_admin` server-only + `is_admin()` re-check + audit log.
- **Token theft** → SecureStore (mobile) / httpOnly cookies (web); short-lived access tokens +
  refresh rotation.
- **Injection / bad input** → server-side Zod at every write; parameterized queries via
  supabase-js/postgres.
- **XSS/CSRF (web/admin)** → CSP + secure headers + SameSite cookies + CSRF tokens.
- **Secret leakage** → secrets only in `apps/api`; env validation fails closed; Sentry scrubbing.
- **Abuse/DoS** → rate limiting on sensitive endpoints.

---

## Assumptions & flagged contradictions
- **A1** Web/admin use httpOnly cookies for the session (preferred) vs supabase-js localStorage;
  chosen for XSS resistance. If the team standardizes on supabase-js localStorage, strict CSP is
  the compensating control — flagged.
- **A2** Rate limiting implemented in `apps/api` (and/or edge middleware); §46 lists it as a
  requirement without a mechanism — chose app-layer limiter. 
- **A3** MFA is not required by the spec and not in MVP scope; noted as a future hardening.
- No security-specific contradictions beyond the shared greenfield note (C1).
