## Exploration: Patients Module

### Current State

**Backend (Rust) — fully implemented (real code, not stubs):**
- `models/mod.rs`: `Patient`, `CentroPoblado`, `Control`, `Treatment`, `VisitaDomiciliaria` structs — all with `#[serde(rename_all = "camelCase")]`
- `dto/mod.rs`: `CreatePatientDTO`, `UpdatePatientDTO` — complete with all fields including `nombre_apoderado`, `celular_apoderado`, `centro_poblado_id`
- `repositories/patient_repository.rs`: Full trait + `SqlitePatientRepository` impl — `create`, `update`, `find_by_id`, `find_by_dni`, `find_by_historia`, `search` (SQL LIKE across 5 fields), `deactivate` (soft delete)
- `services/patient_service.rs`: Complete validation — DNI 8 digits (regex), DNI uniqueness, historia_clinica uniqueness, required fields (nombres, apellidos, fecha_nacimiento), sexo must be M/F, audit logging on create/update/deactivate
- `commands/patients.rs`: 5 Tauri commands — `create_patient`, `update_patient`, `get_patient`, `search_patients`, `deactivate_patient` — with role guards (`CLINICAL_ROLES = [1, 3]` for mutations, `ALL_ROLES = [1, 2, 3, 4]` for reads)
- `audit/mod.rs`: Full `AuditService` — logs CREATE, UPDATE, DEACTIVATE events with old/new data
- `migrations/003_create_patients.sql`: Schema with indexes on dni, historia_clinica, activo, apellidos
- `migrations/004_create_centros_poblados.sql`: Schema with index on nombre
- `lib.rs`: Patient service wired into `AppState`, all 5 patient commands registered in invoke_handler

**Backend — what's MISSING:**
- ❌ **No `list_centros_poblados` command**: `CentroPoblado` model exists but there's no repository, service, or command to query them. Needed for the patient form dropdown.
- ❌ **No pagination**: `search()` uses `LIKE '%query%'` with no LIMIT/OFFSET. For 5000+ patients (PRD-003 §23), this will be slow and return too much data.
- ❌ **No age computation**: PRD-001 RF-003 and PRD-007 §5 say "Edad calculada automáticamente" but no code computes age from `fecha_nacimiento`.
- ❌ **No `CentroPoblado` repository**: Not in `repositories/mod.rs`. Only the model exists.
- ⚠️ **`nombre_apoderado` required vs optional mismatch**: PRD-003 and PRD-007 specify `nombre_apoderado` as **required**, but the Rust model and DTO both use `Option<String>`. The DB column allows NULL.
- ⚠️ **`centro_poblado_id` required vs optional mismatch**: PRD-003 specifies it as required, but the DB column is nullable and the model uses `Option<i64>`.
- ⚠️ **No `celular_apoderado` validation**: PRD-007 §5 says "9 dígitos" if provided, but the backend has no validation for this.

**Frontend (React/TypeScript):**

*Service layer — fully functional:*
- ✅ `services/patientService.ts`: All 5 Tauri invoke calls (`createPatient`, `updatePatient`, `getPatient`, `searchPatients`, `deactivatePatient`) — real code, properly handling `ApiResponse` envelope

*Types — partially complete:*
- ⚠️ `types/patient.ts`:
  - `Patient` interface: Missing fields → `direccion`, `nombreApoderado`, `celularApoderado`, `fechaRegistro`
  - `CreatePatientDTO`: Missing `nombreApoderado`, `celularApoderado`
  - `UpdatePatientDTO`: Missing `historiaClinica`, `dni`, `nombreApoderado`, `celularApoderado`, `activo`

*State/hooks — structurally correct but stubs:*
- ⚠️ `stores/patientStore.ts`: Has correct Zustand structure (`patients`, `selectedPatient`, `loading`, `error`) but all 4 async methods have invoke calls **commented out** — currently no-ops
- ⚠️ `hooks/usePatients.ts`: Wraps the store, provides `refresh()`, `search()`, `createPatient()` — but all delegates to the stub store

*UI pages — visual structure present, no data integration:*
- ❌ `PatientListPage.tsx`:
  - Search bar renders (but calls no Tauri command)
  - Table renders with correct headers (H. Clínica, DNI, Nombres, Apellidos, Sexo, Estado, Acciones)
  - No TanStack Table integration (manual `<table>`)
  - No patient rows rendered (shows "Use el buscador" placeholder)
  - PRD-007 §4 specifies columns: H. Clínica, DNI, Nombres, **Edad**, **Centro Poblado**, Estado — current stub has Apellidos, Sexo instead
  - No Edit/View actions on rows

- ❌ `PatientFormPage.tsx`:
  - Form renders with basic fields (historiaClinica, dni, nombres, apellidos, fechaNacimiento, sexo, direccion)
  - Uses basic `react-hook-form` without Zod resolver (commented out)
  - **Missing fields**: centroPobladoId dropdown, nombreApoderado, celularApoderado
  - **No edit mode**: No route for `/patients/:id/edit`, form doesn't load existing data
  - onSubmit is a stub (navigates without calling Tauri)

- ❌ `PatientDetailPage.tsx`:
  - Tab structure renders correctly: Datos Generales, Controles, Tratamientos, Visitas
  - All tabs show placeholder text ("próximamente" / "—")
  - No Tauri invoke calls anywhere

*Routing/Sidebar — correct:*
- ✅ `router.tsx`: Routes registered for `/patients`, `/patients/new`, `/patients/:id`
- ✅ `Sidebar.tsx`: "Pacientes" nav item present, visible to roles 1-4
- ❌ Missing: `/patients/:id/edit` route

### Affected Areas

**Backend (new files needed):**
- `src-tauri/src/repositories/centro_poblado_repository.rs` — **NEW**: Trait + SqliteCentroPobladoRepository for querying centros poblados
- `src-tauri/src/repositories/mod.rs` — Add `centro_poblado_repository` module and re-export
- `src-tauri/src/commands/centros_poblados.rs` — **NEW**: `list_centros_poblados` command
- `src-tauri/src/commands/mod.rs` — Add `centros_poblados` module

**Backend (modifications needed):**
- `src-tauri/src/repositories/patient_repository.rs` — Add pagination (LIMIT/OFFSET) to `search()`, add `list_paginated()` method
- `src-tauri/src/services/patient_service.rs` — Add age computation (calculate from fecha_nacimiento), add celular_apoderado validation (9 digits), make nombre_apoderado required
- `src-tauri/src/dto/mod.rs` — Ensure `UpdatePatientDTO` has all fields (already does on backend)
- `src-tauri/src/lib.rs` — Register new `centros_poblados` commands, wire up new repository

**Frontend (modifications needed):**
- `src/types/patient.ts` — Add missing fields: `direccion`, `nombreApoderado`, `celularApoderado`, `fechaRegistro` to `Patient`; add `nombreApoderado`, `celularApoderado` to `CreatePatientDTO`; add `historiaClinica?`, `dni?`, `nombreApoderado?`, `celularApoderado?`, `activo?` to `UpdatePatientDTO`
- `src/types/centro_poblado.ts` — **NEW**: `CentroPoblado` interface
- `src/services/centroPobladoService.ts` — **NEW**: Service to invoke `list_centros_poblados`
- `src/stores/patientStore.ts` — Wire up real Tauri invoke calls in all 4 methods
- `src/stores/centroPobladoStore.ts` — **NEW**: Zustand store for centros poblados
- `src/hooks/usePatients.ts` — Wire up real store (already delegates, will work when store is real)
- `src/hooks/useCentrosPoblados.ts` — **NEW**: Hook for centros poblados
- `src/features/patients/PatientListPage.tsx` — Integrate TanStack Table, wire search to Tauri, add row actions (View, Edit, Deactivate), fix columns per PRD-007
- `src/features/patients/PatientFormPage.tsx` — Add Zod validation schema matching backend rules, add missing form fields (centroPoblado, apoderado, celular), support create + edit modes, wire onSubmit to Tauri
- `src/features/patients/PatientDetailPage.tsx` — Load patient data on mount, populate all info fields, add real content to Controles/Tratamientos/Visitas tabs (loading from existing commands)
- `src/app/router.tsx` — Add `/patients/:id/edit` route (edit mode)
- `src/utils/constants.ts` — Add `LIST_CENTROS_POBLADOS` to `API_COMMANDS`, add `PATIENT_EDIT` to `ROUTES`

### Approaches

#### 1. Centros Poblados API

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Simple query command** — Add `list_centros_poblados` command that queries `SELECT * FROM centros_poblados WHERE activo = 1` without dedicated repository/service | Minimal code, fast to implement | Skips hexagonal architecture pattern; harder to test in isolation; no abstraction layer if query logic gets complex | Low |
| **B: Full repository + service** — Create `CentroPobladoRepository` trait + SQLite impl, inject into a lightweight service | Follows existing architecture pattern; testable; easy to extend with search/filter later | More boilerplate for what's essentially a simple lookup | Medium |
| **C: Frontend-only hardcoded list** | Zero backend work | Cannot be maintained; violates PRD requirement for dropdown from centros_poblados table; defeats purpose of the DB table | Very Low — NOT RECOMMENDED |

**Recommendation: Approach B**
The architecture is hexagonal with traits everywhere. Adding a repository for `CentroPoblado` is consistent with the existing pattern (see `PatientRepository`, `UserRepository`, etc.). The repository can live in `centro_poblado_repository.rs` and the service can be a simple passthrough (or even skipped if the command calls the repo directly). For a desktop app with relatively small data (< 200 centro poblado records), fetch is instant. No caching needed — fetch on mount.

#### 2. Search Strategy (Pagination)

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Backend LIMIT/OFFSET** — Add `page` and `page_size` params to `search()`, return results + total count | Scales to 30K patients (PRD projection); familiar pattern; keeps frontend simple | Requires changing Rust trait, service, and command signatures; need to return pagination metadata | Medium |
| **B: Frontend pagination of full results** — Keep backend as-is, paginate in TanStack Table | No backend changes needed | Breaks at ~500+ patients (PRD says 5K year 1, 30K year 5); defeats search performance goals | Very Low — NOT RECOMMENDED |
| **C: Backend search without pagination, frontend virtual scrolling** | Smooth UX for large lists | Complex frontend; still loads all data into memory | High |

**Recommendation: Approach A — Backend LIMIT/OFFSET**
PRD-007 §22 specifies search < 1 second. PRD-003 §23 projects 5,000 patients year 1, 30,000 by year 5. A `LIMIT 20 OFFSET 0` approach keeps responses small and fast. Add a paginated response wrapper:

```rust
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}
```

Modify `PatientRepository::search()` to accept `page` and `page_size` params, add a `COUNT(*)` query total. The existing `LIKE` pattern on indexed columns is fine for search speed.

#### 3. Age Calculation

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Compute on read in service layer** — Add `edad: Option<i32>` to a response DTO, compute from `fecha_nacimiento` in `PatientService` before returning | Always accurate; no stale data; no migration needed | Slight CPU cost per read; need a response wrapper with computed field | Low |
| **B: Compute on frontend** — Send `fechaNacimiento`, let React compute age | Zero backend changes | Every component that shows age needs the calculation; inconsistent if multiple components | Low |
| **C: Compute on write and store** — Add `edad` column, compute on create/update | Fast reads; no computation on every list render | Stale data risk (age changes daily); need migration; violates "single source of truth" | Medium — NOT RECOMMENDED |

**Recommendation: Approach A — Compute on backend read + display on frontend**
The PRD says "calculate automatically" (RF-003). Computing at read time in the service layer is the cleanest approach. Create a `PatientResponse` that extends `Patient` with a computed `edad` field (in years and optionally months for children under 2). The frontend receives the computed age and displays it directly. This matches the PRD-001 RF-003 requirement without data consistency issues.

#### 4. Form Validation (Frontend-Backend Parity)

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Zod schema mirroring backend** — Define same rules: DNI 8 digits, sexo enum, celular 9 digits, apoderado required | Single source of truth per layer; Zod catches errors before Tauri call; backend is safety net | Duplication of validation rules (but intentional — frontend for UX, backend for security) | Low-Medium |
| **B: Backend-only validation** — Submit raw data, let Rust validate | Simpler frontend | Slower UX (round-trip for every error); violates RNF-005 (usability) | Low — NOT RECOMMENDED |

**Recommendation: Approach A — Zod schema on frontend**
React Hook Form + Zod are already in `package.json`. The commented-out Zod schema in `PatientFormPage.tsx` shows the intention. Create a `patientSchema` matching backend rules:
- `dni`: `.length(8)` + regex `^\d{8}$`
- `historiaClinica`: `.min(1)`
- `nombres`, `apellidoPaterno`, `apellidoMaterno`: `.min(1)`
- `fechaNacimiento`: valid date string, not future
- `sexo`: `.enum(["M", "F"])`
- `nombreApoderado`: `.min(1)` (PRD requires it)
- `celularApoderado`: optional, `.length(9)` + `^\d{9}$` if provided

#### 5. UpdatePatientDTO Frontend Gaps

**Frontend `UpdatePatientDTO` is missing fields that the Rust backend already expects:**
- `historiaClinica?: string`
- `dni?: string`
- `nombreApoderado?: string`
- `celularApoderado?: string`
- `activo?: boolean`

These need to be added to the frontend type to match the Rust DTO. The `patientService.ts` already sends these through `invoke("update_patient", { token, id, dto })` — but `dto` will be missing these fields if the TypeScript type doesn't include them.

### Recommendation

| Decision | Recommendation |
|----------|---------------|
| Centros poblados API | Full repository + command (hexagonal consistency) |
| Search pagination | Backend LIMIT/OFFSET with `PaginatedResult` wrapper |
| Age calculation | Compute on read in service layer, return as computed field |
| Form validation | Zod schema on frontend mirroring backend rules |
| Frontend types | Add all missing fields to match Rust DTOs |
| Patient list table | TanStack Table with server-side pagination |
| Patient form | Create + Edit modes, add missing fields (centroPoblado, apoderado, celular) |
| Patient detail | Load data on mount, populate tab content from existing commands |

### Risks

1. **CentroPoblado required vs nullable mismatch**: PRD-003 specifies `centro_poblado_id` as required but DB allows NULL and model uses `Option<i64>`. If we enforce NOT NULL, existing data without centro_poblado will break. **Medium risk** — decide in design phase whether to enforce via DB constraint or application validation.

2. **nombre_apoderado required conflict**: Same pattern — PRD says required, backend treats as optional. Adding `NOT NULL` to the column requires a migration to backfill NULL values. **Medium risk**.

3. **Frontend type drift**: `UpdatePatientDTO` frontend is missing 5 fields the backend expects. The Tauri invoke will pass incomplete data. **High risk** for the update flow — must fix before development.

4. **Search performance at 30K patients**: The current `LIKE '%query%'` pattern doesn't use indexes effectively (LIKE with leading wildcard does a full scan). At 30K records with active search across 5 columns, performance may degrade. **Medium risk** — monitor and add FTS5 (SQLite full-text search) if needed.

5. **Age precision for children under 2**: PRD clinical context uses `edad_meses` for controls. The computed age should show years AND months for children under 2 years old. **Low risk** — just a UX consideration.

6. **Edit route doesn't exist**: `/patients/:id/edit` is not in the router. The PatientListPage stub has no "Editar" action. The PatientFormPage doesn't load existing data. Without this, edit flow is broken. **High risk** — must add route and edit mode to form.

### Ready for Proposal

Yes. The analysis is complete and all decision points have clear tradeoffs and recommendations. The proposal should cover:

| Phase | Items |
|-------|-------|
| **Backend additions** | `CentroPobladoRepository`, `list_centros_poblados` command, paginated search, age computation, celular validation |
| **Backend fixes** | Make `nombre_apoderado` required (or decide to leave optional), add celular validation |
| **Frontend types** | Fix missing fields in `Patient`, `CreatePatientDTO`, `UpdatePatientDTO`; add `CentroPoblado` type |
| **Frontend services** | Add `centroPobladoService.ts` |
| **Frontend stores** | Wire up `patientStore` real invokes, add `centroPobladoStore` |
| **Frontend hooks** | Add `useCentrosPoblados.ts` |
| **Frontend pages** | Rewrite `PatientListPage` (TanStack Table + search + pagination + actions), rewrite `PatientFormPage` (Zod + centroPoblado dropdown + apoderado fields + edit mode), rewrite `PatientDetailPage` (real data + tabs content) |
| **Routes** | Add `/patients/:id/edit` + constants |
