## Exploration: Authentication Module

### Current State

The project has a surprisingly complete backend auth scaffolding but stub-only frontend integration and several critical gaps:

**Backend (Rust) — what's already implemented (real code, not stubs):**
- `security/mod.rs`: Argon2id `hash_password()` / `verify_password()` + UUID v7 `generate_session_token()` — **fully implemented**
- `services/auth_service.rs`: `login()`, `logout()`, `current_user()`, `validate_token()` — all real methods with in-memory `Mutex<HashMap<String, i64>>` session store and audit logging
- `repositories/user_repository.rs`: Full trait + sqlx impl — `create`, `find_by_username`, `find_by_id`, `update`, `deactivate`, `list_all`
- `commands/auth.rs`: `login()`, `logout()`, `current_user()` — registered in `lib.rs`
- `commands/users.rs`: `list_users()`, `create_user()`, `update_user()`, `deactivate_user()` — **but zero permission checks**
- `audit/mod.rs`: Complete `AuditService` with `log_event()` and `get_events()`
- `database/mod.rs`: Migration runner with `_migrations` tracking table
- `errors/mod.rs`: `AppError` enum with Serialize for Tauri
- `migrations/001_create_roles.sql`: Roles table + seed (Admin, Supervisor, Operador, Consulta)
- `migrations/002_create_users.sql`: Users table with FK to roles

**Backend — what's MISSING:**
- ❌ No initial admin user created anywhere (no seed in migration, no first-run setup)
- ❌ No session expiry/timeout (PRD-008 mandates 8 hours)
- ❌ No rate limiting on failed login attempts
- ❌ No RBAC enforcement on any command (any authenticated frontend can call anything)
- ❌ No password change endpoint
- ❌ `AuthService` uses `Mutex<HashMap>` — fine for single process but no TTL/scavenger
- ❌ No role/permission model defined in code (only as SQL seed data)

**Frontend (React/TypeScript) — what's stub-only:**
- `authStore.ts`: All three methods (`login`, `logout`, `checkSession`) have **real invoke() calls commented out** — currently no-ops
- `authService.ts`: `login()` passes `{ dto }` but Rust command expects `{ usuario, password }` as positional args — **signature mismatch**. `logout()` and `currentUser()` don't pass the token
- `authStore.ts` has NO `token` field (PRD-008 LLD §13 shows a `token: string | null`)

**Frontend — what's structurally complete but disconnected:**
- `LoginPage.tsx`: Full UI, calls `authStore.login()` but store is a no-op
- `AuthGuard.tsx`: Checks `isAuthenticated` from store — always false
- `Header.tsx`: Displays user name + logout button — user is always null
- `Sidebar.tsx`: Shows all nav items — no role-based visibility

**Type mismatch:**
- Frontend `user.ts`: has `email` and `rolNombre` fields not in backend
- Backend serializes `rol_id` → `rolId` via `#[serde(rename_all = "camelCase")]` — that maps correctly
- `AuthState` in store lacks `token` field (needed for app restart / session persistence)

**PRD specification conflicts:**
- PRD-007 §3 specifies distinct error messages ("Usuario no encontrado" vs "Contraseña incorrecta") — this enables user enumeration. Current code uses generic `AppError::Unauthorized`
- PRD-008 §21 says "Tiempo de Sesión: 8 horas" — not implemented anywhere

### Affected Areas

- `src-tauri/src/services/auth_service.rs` — Add session expiry, rate limiting, token storage format with timestamps
- `src-tauri/src/services/mod.rs` — May need to expose new services (role service, session service)
- `src-tauri/src/security/mod.rs` — Add password complexity validation
- `src-tauri/src/errors/mod.rs` — May need more granular auth error variants
- `src-tauri/src/commands/auth.rs` — Add token parameter propagation; add `check_session` command
- `src-tauri/src/commands/users.rs` — Add permission checks on every command
- `src-tauri/src/commands/patients.rs` — Add permission checks (already created, but need guard)
- `src-tauri/src/commands/controls.rs` — Add permission checks
- `src-tauri/src/commands/treatments.rs` — Add permission checks
- `src-tauri/src/commands/reports.rs` — Add permission checks
- `src-tauri/src/commands/backups.rs` — Add permission checks (admin-only)
- `src-tauri/migrations/003_create_seed_admin.sql` — New migration for initial admin
- `src/features/auth/LoginPage.tsx` — Wire up to real authStore (mostly done, just uncomment)
- `src/stores/authStore.ts` — Add real invoke calls, add token field, add session persistence
- `src/services/authService.ts` — Fix signature mismatch, add token to logout/currentUser calls
- `src/types/user.ts` — Remove `email` (not in backend), keep `rolNombre` as computed
- `src/components/layout/AuthGuard.tsx` — Add role-based route gating
- `src/components/layout/Sidebar.tsx` — Filter nav items by role
- `src/components/layout/Header.tsx` — Wire up real user data

### Approaches

#### 1. Session Storage

**In-memory HashMap (current approach)**
- Pros: Simple, fast, no DB overhead
- Cons: Lost on restart, no built-in TTL, need to implement expiry manually
- Effort: Low

**Database-backed sessions (sqlite)**
- Pros: Survives restarts, can query/audit, natural TTL via timestamp column
- Cons: More complex, extra table, DB write on every login/logout
- Effort: Medium

**Recommendation: Keep in-memory with TTL**
For a desktop app with a single running process, **in-memory is the right choice**. The DB complication isn't justified. Add a `SessionData` struct with `user_id`, `created_at`, `last_accessed_at` and a scavenger that drops expired sessions on access check. PRD-008 specifies 8-hour sessions, which is per-session lifetime, not idle timeout.

#### 2. Initial Admin User

**Option A: Seed in SQL migration**
- Pros: Simple, runs as part of normal migration flow
- Cons: Password hash would be hardcoded in migration file (generated at dev time); unusable if migration already applied; changing password requires migration edit
- Effort: Low

**Option B: Create-admin on first run (application logic)**
- Pros: Password generated at runtime; no sensitive data in migrations; can prompt user to set password on first launch
- Cons: Needs a mechanism to detect "first run" (check if any users exist)
- Effort: Low-Medium

**Option C: Environment variable / config file**
- Pros: Flexible, no code changes for different deployments
- Cons: Over-engineered for a desktop app; adds config file dependency
- Effort: Medium

**Recommendation: Option B (first-run check)**
Add logic in `lib.rs` `setup()`: after migrations run, check if `users` table is empty. If empty, auto-create an admin user with a known default credential (`admin` / `admin123`) that **forces password change on first login**. This is the standard pattern for local desktop apps. The admin credential hash is generated at runtime with Argon2id, never stored in the migration.

#### 3. Permission Enforcement

**Option A: Backend-only guards in each command**
- Pros: Single source of truth; cannot be bypassed
- Cons: Repeating boilerplate in every command; easier to miss one
- Effort: Medium

**Option B: Middleware wrapper function**
- Pros: `require_role!(command, Admin)` macro or function wrapper; consistent
- Cons: Rust doesn't have middleware middleware in the web sense; need to call explicitly per command
- Effort: Low-Medium

**Option C: Frontend-only**
- Pros: Simplest backend
- Cons: Trivially bypassed by calling Tauri commands from browser console
- Effort: Very Low — NOT RECOMMENDED

**Recommendation: Option B (guard function + frontend respect)**
Create a `require_role(user_repo, token, required_roles)` function that:
1. Validates the session token
2. Looks up the user's role_id
3. Checks against a permission matrix
4. Returns `AppError::Unauthorized` if insufficient

Each command calls `require_role()` at the top. Frontend also filters UI by role for UX. **Both layers** needed — backend for security, frontend for UX.

#### 4. Error Messages (PRD-007 §3 vs security)

**Option A: Follow PRD-007 exactly** — distinct messages per error type
- "Usuario no encontrado"
- "Contraseña incorrecta"
- Pros: Complies with PRD spec, users get specific feedback
- Cons: **User enumeration vulnerability** — attacker can determine which usernames exist
- Effort: Low

**Option B: Generic message** — security best practice
- "Usuario o contraseña incorrectos"
- Pros: No user enumeration
- Cons: Violates PRD-007 §3 wording
- Effort: Low

**Recommendation: Ask the user to decide**
This is a real security-vs-spec tradeoff. Flag it in the proposal. My recommendation is **generic message** for production security, but the PRD explicitly says otherwise.

#### 5. Password Complexity

**PRD says:** nothing specific about complexity
**Current code:** no validation on `CreateUserDTO` password field

**Options:**
- Minimum 6 characters (reasonable for a local clinic app where admins need simplicity)
- Minimum 8 characters with complexity (overkill for local desktop app)
- No validation (current state)

**Recommendation: Minimum 6 characters**
Add `password.len() >= 6` validation in `create_user` command and a new `change_password` command. This is a healthcare desktop app used in clinics — complex passwords lead to sticky notes on monitors.

### Risks

1. **User enumeration via error messages**: PRD-007 mandates distinct messages. If we follow it, any user can discover valid usernames. **Medium risk** for a desktop app (no public internet exposure) but still bad practice.

2. **No initial admin = app is unusable on first launch**: Currently no mechanism creates the first user. Without this, the app is completely locked on first run. **Critical risk** — must be addressed.

3. **No RBAC = any user can do anything**: PRD-007 §2 specifies a detailed permission matrix but nothing enforces it. Users, patients, backups, etc. commands all lack guards. **High risk**.

4. **Frontend-backend type mismatch**: The TypeScript `authService.ts` calls `invoke("login", { dto })` but Rust expects `invoke("login", { usuario, password })`. This will fail silently at runtime. **High risk** for the integration.

5. **No session timeout**: 8-hour sessions with no expiry means a logged-in session lasts forever if the app doesn't restart. **Low-Medium risk** for a local desktop app but violates PRD-008.

6. **Password change unavailable**: No way to change password without direct DB access. **Medium risk** for usability.

### Ready for Proposal

Yes. All key decisions have clear tradeoffs and recommendations. The proposal should cover:

| Decision | Recommendation |
|----------|---------------|
| Session storage | In-memory with TTL (8h) + scavenger |
| Initial admin | Auto-create on first run if users table empty |
| Permission enforcement | Backend guard function + frontend UI filter |
| Error messages | ⚠️ **Needs user decision** — PRD vs security |
| Password validation | Min 6 chars + change_password command |
| Session persistence | Optional: store last token in localStorage for re-auth on restart |
| AuthService token field | Add `token: string \| null` to authStore |
