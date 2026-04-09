# Frontend implementation — handover note

This document is for engineers taking over the **Agentic Storekeeper** web client. It describes what was built, how it fits the broader platform (FastAPI + agents + PostgreSQL), and what remains to wire for production.

---

## 1. Purpose and product context

The frontend is a **multi-tenant financial document intelligence** UI: dashboards (KPIs, trends, vendors, categories), document upload and pipeline visibility, document review with human-in-the-loop edits, natural-language insights (demo), and drill-down into transaction-style rows.

**Important architectural rule:** the browser never talks to MCP tools or the database directly. All persistence and agent orchestration live in the backend. This app talks to **Next.js route handlers** (a small BFF under `/api/bridge/*`), which proxy to FastAPI and enforce **Zod validation** on JSON before responses reach React.

---

## 2. Technology stack

| Area | Choice | Notes |
|------|--------|--------|
| Framework | **Next.js 16** (App Router) | React 19 |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives) | `components.json` configures the registry; theme tokens and motion in `globals.css` — see **§15** |
| Server state | **TanStack Query v5** | Dashboard and document list fetching, cache invalidation after upload |
| Client state | **Zustand** | Tenant switcher (`tenant_id` + session sync), notification drawer items |
| Auth | **`jose`** (HS256 JWT) | httpOnly session cookie; optional FastAPI `access_token` in JWT for bridge `Authorization` |
| Validation | **Zod 4** | Mirrors expected FastAPI/Pydantic shapes; drift is a known risk — see `docs/openapi-codegen.md` |
| Charts | **Recharts 3** | Loaded with `next/dynamic` and `ssr: false` to avoid SSR layout issues |
| Upload UI | **react-dropzone** + **XMLHttpRequest** | Real upload progress and simple retry-on-network-failure |
| Testing | **Vitest** (Node env for unit tests) | `src/**/*.test.ts`; RTL/jsdom present for future component tests |

---

## 3. Repository layout (frontend-focused)

```text
src/
├── app/
│   ├── api/
│   │   ├── bridge/              # BFF: proxy + validate (see §6)
│   │   └── auth/                # login, register, logout, me, onboarding/complete
│   ├── (auth)/login/            # Sign-in
│   ├── (auth)/register/         # New account → onboarding
│   ├── onboarding/              # Post-register wizard (org name + tenant slug)
│   ├── dashboard/               # Main app routes (shell in layout)
│   ├── layout.tsx               # Root: fonts, QueryProvider, globals
│   ├── page.tsx                  # Redirects "/" → "/dashboard"
│   └── globals.css
├── components/
│   ├── auth/                    # LoginForm, RegisterForm, OnboardingWizard
│   ├── dashboard/               # Overview, filters, lazy charts, KPIs, tables
│   ├── documents/               # Upload zone, pipeline stepper, list view, document detail
│   ├── insights/                # Ask / structured answer demo
│   ├── layout/                  # Shell, tenant switcher, notification bell, UserMenu
│   ├── brand/                   # StorekeeperLogo / StorekeeperBrand (§15)
│   ├── providers/               # React Query provider
│   └── ui/                      # shadcn-generated components
├── hooks/
│   ├── use-agent-pipeline-stream.ts   # SSE subscription + event reducer
│   └── use-auth.tsx                   # /api/auth/me + logout
├── lib/
│   ├── auth/                    # constants, jwt sign/verify, cookies, credentials, types
│   ├── api/                     # fetchJsonValidated, bridge-headers (Bearer from session), services
│   ├── config.ts                 # API base URL, mock flags, API_ROUTES path templates
│   ├── dashboard/filter-summary.ts   # Client-side filter refinement (temporary)
│   ├── mock-data.ts              # Financial summary, documents, **mock ledger** for transactions
│   ├── queries/query-keys.ts    # TanStack Query key factory
│   └── upload/upload-with-progress.ts
├── schemas/
│   ├── financial.ts             # Summary + insight answer shapes
│   ├── documents.ts             # Document list, upload response, audit
│   └── agent-events.ts          # Versioned SSE/WebSocket event envelope (v1)
├── stores/
│   ├── tenant-store.ts
│   └── notification-store.ts
├── middleware.ts                 # Auth gates + tenant headers (see §5)
└── test/                         # Vitest setup (optional for current tests)

docs/openapi-codegen.md          # Strategy to keep Zod ↔ Pydantic aligned
```

---

## 4. Mock mode vs live API

**Default behavior:** mock mode is **on** unless `NEXT_PUBLIC_USE_MOCK_DATA` is explicitly set to the string `false`.

- Implemented in `src/lib/config.ts` → `useMockDataOnly()`.
- When mock is on, **bridge routes** return canned JSON (or generate simulated SSE) so the UI runs **without a running FastAPI** instance.
- Client loaders in `lib/api/financial.service.ts` and `documents.service.ts` can also use **`NEXT_PUBLIC_API_ALLOW_MOCK_FALLBACK`** to fall back to in-memory mocks if the bridge returns an error (useful during mixed onboarding).

**Switching to production backend:** set `NEXT_PUBLIC_USE_MOCK_DATA=false`, `NEXT_PUBLIC_API_URL` to the FastAPI origin, and align response bodies with the Zod schemas (or update Zod to match the API — then run contract checks in CI).

---

## 5. Authentication, onboarding, and middleware

### 5.1 Session model

- **Cookie `storekeeper_session`:** httpOnly JWT (HS256 via **`jose`**). Claims include `sub`, `email`, `name`, `role` (`admin` or `staff`), `tenantId`, `onboardingCompleted`, optional `organizationName`, and optional **`apiAccessToken`** when the user logged in through FastAPI (live mode).
- **Cookie `tenant_id`:** non–http-only, kept in sync on login/onboarding/logout for the existing tenant switcher and for middleware. **`TenantSwitcher`** can add unknown slugs (e.g. after onboarding) via `setActiveTenant(id, displayName)`.
- **Signing key:** `AUTH_SECRET` — must be **≥ 32 characters** in production. In **development**, `src/lib/auth/constants.ts` falls back to a fixed dev secret if unset (do not rely on this outside local dev).
- **Core modules:** `src/lib/auth/constants.ts`, `jwt.ts` (sign/verify), `cookies.ts` (set/clear session + tenant), `types.ts` (`SessionClaims`, `PublicSession`), `credentials.ts` (mock users + FastAPI login mapping).

### 5.2 Auth API routes (`src/app/api/auth/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Body `{ email, password }`. Mock: table in `credentials.ts`. Live: `POST {API}/api/v1/auth/login`; expects `access_token` + `user` (`id`, `email`, `tenant_id`, `onboarding_completed`, etc.). Sets JWT + cookies. |
| `/api/auth/register` | POST | Body `{ email, password, name }`. Mock: new session with `tenantId: pending`, `onboardingCompleted: false`. Live: `POST {API}/api/v1/auth/register` (same response shape expectation as login where applicable). |
| `/api/auth/logout` | POST | Clears auth cookies. |
| `/api/auth/me` | GET | Returns `{ user: PublicSession or null }` for the header / `useAuth`. |
| `/api/auth/onboarding/complete` | POST | Requires session with `onboardingCompleted: false`. Body `{ organizationName, tenantSlug }` (slug: lowercase, hyphens). Re-issues JWT with real `tenantId`, `organizationName`, `onboardingCompleted: true`. |

Upstream paths for auth are also declared as `API_ROUTES.authLogin` and `API_ROUTES.authRegister` in `src/lib/config.ts`.

### 5.3 Mock demo users (`src/lib/auth/credentials.ts`)

| Email | Password | Behavior |
|-------|----------|----------|
| `admin@demo.com` | `admin123` | `admin`, `demo-org`, onboarding complete |
| `staff@demo.com` | `staff123` | `staff`, `demo-org`, onboarding complete |
| `onboard@demo.com` | `onboard123` | `staff`, `pending` tenant, **must complete onboarding** |

`listDemoAccountsForUi()` is available for dev/docs; the login UI does not list demo accounts (see **§15** for product-facing chrome).

### 5.4 UI flows

- **`/login`:** `LoginForm` (client); redirects to `?from=` when appropriate; unfinished onboarding → `/onboarding`.
- **`/register`:** `RegisterForm` → typically **`/onboarding`** after success.
- **`/onboarding`:** `OnboardingWizard` — welcome step then organization name + tenant slug; finishes via `POST /api/auth/onboarding/complete`.
- **Dashboard header:** `UserMenu` (`useAuth`) — email, role, sign out. **Do not** call `buttonVariants` from **Server Components** on auth/marketing pages; use plain `Link` + Tailwind or a tiny client wrapper (see transactions page pattern).

### 5.5 Middleware (`src/middleware.ts`)

**Matcher:** `/dashboard/:path*`, `/onboarding/:path*`, `/login`, `/register`, `/api/bridge/:path*`.

**Bridge (`/api/bridge/*`):**

- If **`NEXT_PUBLIC_USE_MOCK_DATA` is not `false`** (mock mode): **no session required** — preserves local dev without logging in.
- If **live API** (mock off): **401** when there is no valid session.

Always attaches **`x-tenant-id`** (and **`x-user-id`** when session exists):  
`tenant_id` cookie **if set**, else `session.tenantId`, else `demo-org`.

**Pages:**

- **`/dashboard/*`:** requires session; if `!onboardingCompleted` → redirect **`/onboarding`**.
- **`/onboarding/*`:** requires session; if `onboardingCompleted` → redirect **`/dashboard`**.
- **`/login`, `/register`:** if session exists and onboarding done → **`/dashboard`**; if session exists and onboarding not done → **`/onboarding`**.
- Unauthenticated access to `/dashboard` or `/onboarding` → **`/login?from=…`**.

### 5.6 Bridge + Bearer token (live mode)

`src/lib/api/bridge-headers.ts` → **`bridgeUpstreamHeaders(request)`** builds headers for FastAPI:

- `x-tenant-id` (same precedence as middleware intent),
- `Authorization: Bearer <apiAccessToken>` when the session JWT includes `apiAccessToken` (set after real login).

If the client sends `Authorization` explicitly, that wins over the session-derived token.

**Handover:** Confirm FastAPI validates Bearer tokens and trusts `x-tenant-id` (or move to server-only tenant resolution from JWT).

---

## 6. API bridge (BFF) — routes and contracts

*(Upstream auth paths: `API_ROUTES.authLogin`, `API_ROUTES.authRegister` — used by `src/app/api/auth/*`, not repeated in the table below.)*

All paths are **relative to** `NEXT_PUBLIC_API_URL` when not in mock mode. Upstream path templates live in `API_ROUTES` inside `src/lib/config.ts`.

| Next route | Role |
|------------|------|
| `GET /api/bridge/financial-summary` | Proxies query string to FastAPI; response must satisfy `financialSummarySchema`. |
| `GET /api/bridge/documents` | List; body must match `documentListResponseSchema` (`{ items: [...] }`). |
| `POST /api/bridge/documents` | Multipart upload; response must match `documentUploadResponseSchema` (`id`, optional `job_id`). |
| `GET /api/bridge/documents/[id]/pipeline/events` | **SSE** proxy; in mock mode, emits a scripted sequence. Events must validate against `agentPipelineEventSchema` (see §7). |
| `GET /api/bridge/documents/[id]/audit` | Audit entries; `auditTrailResponseSchema`. |
| `PATCH /api/bridge/documents/[id]/parsed` | Forwards JSON body to FastAPI “parsed patch” endpoint. |
| `POST /api/bridge/documents/[id]/agents/reparse` | Triggers agent re-run on backend. |

**Validation failures:** if upstream returns JSON that does not parse with Zod, the bridge responds with **502** and structured error hints — the UI should show an error state (dashboard does this for the summary query).

**Client helper:** `fetchJsonValidated` in `src/lib/api/client.ts` — always use this (or equivalent) for JSON APIs so unvalidated data never drives currency displays.

---

## 7. Agent pipeline events (SSE)

**Schema:** `src/schemas/agent-events.ts`.

- Envelope includes **`v: 1`** for forward compatibility.
- Discriminated union **`type`**: `step_started`, `step_completed`, `step_failed`, `pipeline_completed`.
- **`step`** values are fixed: `ocr`, `classification`, `parsing`, `validation`, `categorization`, `reconciliation`, `dashboard`.
- Failures carry **`error_code`** (`PipelineFailureCode`) and **`message`**; the stepper maps codes to user-facing copy via `userFacingPipelineMessage` in `src/lib/api/errors.ts`.

**Client hook:** `useAgentPipelineStream(documentId)`. Subscribes to `EventSource` on `/api/bridge/documents/:id/pipeline/events`, parses each `data:` line as JSON, validates with `agentPipelineMessageSchema`, unwraps optional `{ event: ... }` gateway wrapper, and folds events into `PipelineStep[]` for `AgentWorkflowStepper`.

**WebSocket:** not implemented; same payload shapes can be reused behind a thin adapter if you prefer WS.

---

## 8. Feature modules

### 8.1 Dashboard (`/dashboard`)

- **`DashboardOverview`** (client): TanStack Query calls `loadFinancialSummary()` → bridge; shows loading and **destructive Alert** on `ApiError`.
- **`DashboardFiltersBar`**: writes filters to **URL search params** (`category`, `vendor`, `fromMonth`, `toMonth`). Month filters use **string comparison** on labels until the API supports real dates — see comment in `filter-summary.ts`.
- **`applyDashboardFilters`**: subset of summary for charts/tables when backend ignores query params (temporary).
- **Charts:** `LazyExpenseDonut`, `LazyMonthlyTrend` — dynamic import, `ssr: false`.
- **Drill-down:** donut footer and vendor table link to `/dashboard/transactions?category=…` or `?vendor=…`.

### 8.2 Documents (`/dashboard/documents`)

- **`DocumentsView`:** list via `loadDocumentsList()` (validated); **`UploadZone`** for files.
- **Upload:** `uploadFormWithProgress` posts `FormData` to `/api/bridge/documents`; field name **`files`** (multiple). On success, response must include **`id`** for the pipeline; `EventSource` opens on that id.
- **Notifications:** success/error pushes into `notification-store`; **NotificationBell** in header shows recent items.

### 8.3 Document detail (`/dashboard/documents/[id]`)

- **`DocumentDetailClient`** (client page wrapper uses `useParams`).
- **Metadata** today is still resolved against **`mockRecentDocuments`** for demo ids — **handover:** replace with `GET /api/v1/documents/:id` via bridge when available.
- **Human-in-the-loop:** textarea JSON; **Save** → `PATCH /api/bridge/documents/:id/parsed`; **Re-run agents** → `POST .../agents/reparse`.
- **Audit:** `loadAuditTrail` → bridge audit route; mock returns sample entries when mock mode is on.
- **Static stepper block** shows confidence/reasoning demo text; live SSE is documented inline (primary live stream is post-upload on documents page).

### 8.4 Transactions (`/dashboard/transactions`)

- **Server Component**; **no** `buttonVariants` or other client-only imports on this page (lesson learned: shadcn `button.tsx` is `"use client"`).
- Data from **`mockLedgerTransactions`** + **`filterMockLedgerRows`** until a real transactions API exists.

### 8.5 Insights (`/dashboard/insights/ask`)

- Client form; **demo** structured answer in memory; production should call a FastAPI insight endpoint and validate with `insightAnswerSchema`.

### 8.6 Auth surfaces

Implemented flows are documented in **§5** (`/login`, `/register`, `/onboarding`, `UserMenu`, middleware). There is no “skip to dashboard” bypass while session protection is enabled for `/dashboard`.

---

## 9. Key Zod schemas (maintenance hotspot)

| File | Responsibility |
|------|----------------|
| `schemas/financial.ts` | `financialSummarySchema`, `insightAnswerSchema` |
| `schemas/documents.ts` | List, upload response, audit entries |
| `schemas/agent-events.ts` | SSE event stream |

Any change on the FastAPI side to these payloads **must** be reflected here (or generated from OpenAPI — see `docs/openapi-codegen.md`).

---

## 10. Testing and quality

- **Unit:** `npm test` runs Vitest on `src/**/*.test.ts` (Node environment). Example: `filter-summary.test.ts`.
- **Build:** `npm run build` — must pass in CI.
- **Lint:** `npm run lint`.
- **Known noise:** Recharts may log zero-size warnings during static prerender; charts are client-only for real use.

---

## 11. Environment variables (reference)

Copy from `.env.example`. Minimum understanding:

- **`AUTH_SECRET`** — Random string **≥ 32 characters** to sign session JWTs (**required in production**). Development may omit it and use the built-in fallback (see §5.1).
- **`NEXT_PUBLIC_API_URL`** — FastAPI origin for server-side `fetch` in bridge and auth routes (live mode).
- **`NEXT_PUBLIC_USE_MOCK_DATA`** — When **not** `false`, mock data + **anonymous `/api/bridge/*`** (no login). Set to **`false`** for production so the bridge requires a session.
- **`NEXT_PUBLIC_API_ALLOW_MOCK_FALLBACK`** — dev-only soft fallback on API errors for loaders.

---

## 12. Known gaps and recommended next steps

1. **Auth hardening:** Password hashing, rate limiting, refresh tokens, MFA, email verification, and OAuth/OIDC provider support are **out of scope** of the current JWT cookie implementation — extend FastAPI and optionally adopt Auth.js / custom IdP.
2. **Document detail source of truth:** Stop using `mockRecentDocuments` for metadata; add bridge `GET /documents/:id` and typed schema.
3. **Transactions API:** Replace `mockLedgerTransactions` with validated API + pagination.
4. **Insight API:** Wire `InsightsChat` to backend; keep validating with Zod.
5. **Large uploads:** Multipart limits, resumable/chunked uploads, and virus scanning are backend concerns; extend client when contract is fixed.
6. **Next.js middleware:** Next 16 warns that the `middleware` convention may move to **“proxy”** — watch release notes and migrate when required.
7. **Contract CI:** Golden JSON fixtures validated by both Pydantic and Zod (or single OpenAPI codegen pipeline).
8. **Component / E2E tests:** Add `*.test.tsx` with Testing Library and optionally Playwright against mock or test API.

---

## 13. How to run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` — root redirects to `/dashboard`. If the app is configured for **live API** (`NEXT_PUBLIC_USE_MOCK_DATA=false`), the middleware will send you to **`/login`** until you authenticate. In **mock mode**, bridge calls work without login, but `/dashboard` still expects a session — use **`/login`** (demo accounts in §5.3) or register → onboarding.

With default mock-friendly env, **no Python service is required** for much of the UI once you are signed in.

---

## 14. Single-point contacts in code

| Concern | Start here |
|---------|------------|
| Auth / session / onboarding | `src/lib/auth/*`, `src/app/api/auth/*`, `src/middleware.ts`, `components/auth/*` |
| Change FastAPI paths | `src/lib/config.ts` → `API_ROUTES` |
| Toggle mock behavior | `src/lib/config.ts` → `useMockDataOnly`, bridge `route.ts` files, middleware bridge bypass (§5.5) |
| Dashboard data loading | `src/lib/api/financial.service.ts`, `dashboard-overview.tsx` |
| Upload + SSE | `upload-with-progress.ts`, `upload-zone.tsx`, `use-agent-pipeline-stream.ts` |
| Demo financial/doc/ledger data | `src/lib/mock-data.ts` |
| New API response shape | Matching `src/schemas/*.ts` + bridge handler parse |
| Theme tokens, motion, global layout | `src/app/globals.css`, `src/app/layout.tsx` (**§15**) |
| Brand mark / wordmark | `src/components/brand/storekeeper-brand.tsx` (**§15**) |

---

## 15. Styling guide (Neo-Wakandan Intelligence)

**Theme intent:** Dark, precise, trustworthy financial UI — purple primary, **gold** for standout KPIs, **green / red** for money in vs out, subtle futuristic accents. Favor geometric **low-opacity** background texture only (no literal tribal prints); symmetry and structure over decorative noise.

### 15.1 Where styling lives

| Area | Location |
|------|----------|
| Design tokens, chart colors, `neo-*` variables, keyframes, `body` pattern, heading scale | `src/app/globals.css` |
| Fonts — **Inter** (body), **Space Grotesk** (headings via `--font-heading`), **Geist Mono** (code) | `src/app/layout.tsx` — root `<html>` includes `dark` so shadcn dark tokens match the single dark palette |
| Cards, buttons, badges, inputs | `src/components/ui/*` (shadcn/Base UI) |
| Logo + “Storekeeper” wordmark | `src/components/brand/storekeeper-brand.tsx` |

Extend Tailwind via `@theme inline` in `globals.css`; prefer semantic tokens (`bg-background`, `text-muted-foreground`, `text-success`, `text-kpi-gold`) over raw hex in components.

### 15.2 Color tokens

Defined on `:root` / `.dark` in `globals.css`. Primary **brand** variables:

| Token | Value | Usage |
|-------|--------|--------|
| `--neo-bg` | `#0B0F14` | Page background |
| `--neo-primary` | `#6C3BFF` | Primary actions, focus ring (`--primary`, `--ring`) |
| `--neo-accent-gold` | `#D4AF37` | Hero financial figures — Tailwind `text-kpi-gold` |
| `--neo-success` | `#0FAF8F` | Income, completed steps — `--success`, `text-success` |
| `--neo-danger` | `#E5484D` | Expenses, failures — `--destructive` |
| `--neo-surface` | `#111827` | Sidebar (`--sidebar`) |
| `--neo-surface-2` | `#1F2937` | Panels / muted — `bg-surface-2`, `--muted` |
| `--neo-border` | `rgba(255,255,255,0.08)` | Borders (`--border`) |

**Gradients:** `--gradient-primary` (`135deg`, `#6C3BFF` → `#3B82F6`), `--gradient-success` (teal → green). The default **Button** uses the primary gradient in `components/ui/button.tsx`.

**Charts** (`--chart-1` … `--chart-5`): green (income / revenue line), purple, blue, red (expenses), gold — keep Recharts strokes and donut segments aligned with these.

### 15.3 Typography

- **Body:** Inter (`font-sans`).
- **Titles / headings:** Space Grotesk (`font-heading`); base layer sets **`letter-spacing: 0.5px`** on `h1`–`h3` for a restrained tech feel.
- **Rough scale:** `h1` ~32–40px, `h2` ~24–28px, `h3` ~18–20px (see `@layer base` in `globals.css`).

### 15.4 Surfaces and layout

- **Cards:** `rounded-2xl`, translucent card fill, `border` with purple tint (`rgba(108,59,255,0.15)`), soft purple glow and optional `backdrop-blur` — see `components/ui/card.tsx`.
- **Background:** `body` sits on `--neo-bg`; **`body::before`** draws a fixed geometric line grid at **~3–4% opacity** — keep it subtle.
- **8px grid:** Prefer Tailwind spacing scale; dashboard **shell** uses `border-border`, sidebar **`bg-surface-2`**, active nav with purple tint + light glow.

### 15.5 Interaction and motion

- **Primary button:** Gradient fill, hover brighten + purple glow, **`active:scale-[0.98]`**, disabled **`opacity-50`**.
- **Animations:** `neo-pulse`, `neo-fade-in`, `neo-slide-up`; exposed as `--animate-neo-pulse` (etc.) for Tailwind. Use **pulse** sparingly (e.g. agent step in progress).
- **Agent workflow stepper** (`AgentWorkflowStepper`): active node — purple pulse / loader; completed — green check + **`Badge` variant `success`**; failed — destructive + outline **XCircle**; connector border uses a purple-tinted rail.

### 15.6 Auth and onboarding chrome

- **`(auth)/layout.tsx`:** Vertical **`StorekeeperBrand`** above **`Card`**-wrapped forms; same neo card framing as the dashboard.
- **`onboarding/layout.tsx`:** Header with horizontal brand + “Onboarding”; **`OnboardingWizard`** uses a neo-framed logo tile and step pills with purple active / green completed states.

### 15.7 Data and trust

- Use **gold** only for **high-signal** metrics (e.g. net profit in `kpi-cards.tsx`).
- Charts: **dark / transparent** plot area; **subtle** grid lines.
- Always show **labels** and **currency units** (`Intl.NumberFormat` or explicit `₦` / `$` in copy as product requires).

### 15.8 Iconography

- **Lucide** outline icons; keep stroke weight consistent; prefer outline over heavy filled icons for UI chrome.

---

*This handover reflects the repository state as of the implementation pass; adjust dates and owners in your internal wiki if you copy this content.*
