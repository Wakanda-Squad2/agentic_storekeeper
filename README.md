# Agentic Storekeeper — Financial document intelligence (frontend)

Next.js application for the **Agentic Storekeeper Financial Document Intelligence Platform**: multi-tenant dashboards, document ingestion UI, agent pipeline visibility, and structured insight responses aligned with a FastAPI + PostgreSQL + OpenAI Agent SDK backend.

## Stack

| Layer | Technology |
|--------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| UI | [shadcn/ui](https://ui.shadcn.com/) (Base UI) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Server state | [TanStack Query v5](https://tanstack.com/query) |
| Client state | [Zustand](https://github.com/pmndrs/zustand) (tenant + notifications) |
| Validation | [Zod](https://zod.dev/) — mirror FastAPI / agent JSON guardrails |
| Charts | [Recharts](https://recharts.org/) (lazy-loaded, client-only) |
| Uploads | [react-dropzone](https://react-dropzone.js.org/) + XHR progress + retries |

Forms can use [React Hook Form](https://react-hook-form.com/) alongside Zod as backend contracts stabilize.

## Prerequisites

- Node.js 20+ (recommended)
- npm (ships with Node)

## Setup

```bash
npm install
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Random string **≥ 32 characters** to sign session JWTs (production). Dev falls back to a built-in secret if unset. |
| `NEXT_PUBLIC_API_URL` | FastAPI origin for server-side bridge `fetch` calls |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Omit or any value except `false` = mock REST + simulated SSE. Set `false` when FastAPI is live. |
| `NEXT_PUBLIC_API_ALLOW_MOCK_FALLBACK` | `true` = client loaders fall back to mocks on API errors (dev only) |

See [docs/openapi-codegen.md](docs/openapi-codegen.md) for keeping Zod and Pydantic in sync.

### Troubleshooting

**Tailwind “Cannot find native binding” / `Cannot find module '@tailwindcss/oxide-darwin-arm64'`**

Tailwind v4’s Rust binary installs as an **optional** dependency; npm sometimes skips it ([npm#4828](https://github.com/npm/cli/issues/4828)). On the machine that fails:

```bash
rm -rf node_modules package-lock.json
npm install
```

Ensure optional packages are not omitted: `npm config get omit` — if you see `optional`, run `npm config delete omit` or `npm install --no-omit=optional`. On Apple Silicon, a fallback is `npm install @tailwindcss/oxide-darwin-arm64@4.2.2 --save-dev` (keep the version aligned with `tailwindcss` in your lockfile).

**Dev server over LAN — “Blocked cross-origin request to … /_next/webpack-hmr”**

When you open the app as `http://<your-LAN-IP>:3000` from another device, Next.js blocks dev-only endpoints unless that host is allowlisted. Add to `.env.local` (hostname only, no `http://`):

```bash
NEXT_DEV_ALLOWED_ORIGINS=192.168.0.104
```

Use your real IP; multiple values: `NEXT_DEV_ALLOWED_ORIGINS=192.168.0.104,10.0.0.5`. Restart `npm run dev`. One-shot: `NEXT_DEV_ALLOWED_ORIGINS=192.168.0.104 npm run dev`.

### Authentication and onboarding

- **Session:** JWT in httpOnly cookie `storekeeper_session` (`jose` HS256). Tenant cookie `tenant_id` stays in sync for APIs.
- **Routes:** `/login`, `/register`, `/onboarding` (wizard). Demo users live in `src/lib/auth/credentials.ts`.
- **Middleware:** Protects `/dashboard` and `/onboarding`; `/api/bridge/*` allows anonymous traffic only while mock mode is on (see `src/middleware.ts`).
- **Live backend:** `POST /api/v1/auth/login` and optional `register` — shape documented in `src/lib/auth/credentials.ts` (`fastApiLogin`). Bridge forwards `Bearer` from session when `apiAccessToken` is set.
- **Handover:** [HANDOVER.md](HANDOVER.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (default: [http://localhost:3000](http://localhost:3000)) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run test:watch` | Vitest watch mode |

## API bridge (BFF)

Browser calls **same-origin** routes under `/api/bridge/*`. Each handler forwards `x-tenant-id` (and optional `Authorization`) to FastAPI and **re-validates** JSON with Zod before responding. That way charts never receive unvalidated financial payloads.

| Bridge route | Upstream (configurable in `src/lib/config.ts`) |
|--------------|------------------------------------------------|
| `GET /api/bridge/financial-summary` | `GET {API}/api/v1/financial/summary` |
| `GET/POST /api/bridge/documents` | Document list + multipart upload |
| `GET /api/bridge/documents/[id]/pipeline/events` | SSE proxy (or mock stream) |
| `GET /api/bridge/documents/[id]/audit` | Audit trail |
| `PATCH /api/bridge/documents/[id]/parsed` | Human edits to parsed JSON |
| `POST /api/bridge/documents/[id]/reprocess` | Proxies `POST /api/v1/documents/{id}/reprocess` |

Agent pipeline events must match `src/schemas/agent-events.ts` (`agentPipelineEventSchema`, version `v: 1`). WebSockets can use the same payload shapes behind a small adapter.

## Route map

| Path | Purpose |
|------|---------|
| `/` | Redirects to `/dashboard` |
| `/login` | Auth shell (placeholder; JWT/OAuth + roles still to wire) |
| `/dashboard` | Validated KPIs + filters + lazy charts + recent documents (React Query) |
| `/dashboard/transactions` | Drill-down shell (`category` / `vendor` query params) |
| `/dashboard/documents` | XHR upload with progress, SSE stepper, validated document list |
| `/dashboard/documents/[id]` | Preview, editable parsed JSON, audit trail, re-parse |
| `/dashboard/reports/*` | Report stubs / demo charts |
| `/dashboard/insights/ask` | Structured insight answers (`insightAnswerSchema`) |

## Project structure (high level)

```text
src/
├── app/
│   ├── api/bridge/           # BFF: proxy + Zod validation
│   ├── (auth)/login/
│   └── dashboard/
├── components/
│   ├── dashboard/            # overview, filters, lazy charts
│   ├── documents/           # upload, stepper, detail HITL
│   ├── insights/
│   ├── layout/              # shell, tenant, notifications
│   └── ui/
├── hooks/                    # e.g. useAgentPipelineStream (SSE)
├── lib/
│   ├── api/                  # fetchJsonValidated, domain loaders
│   ├── dashboard/           # client-side filters (until API supports all params)
│   ├── queries/             # TanStack Query keys
│   └── upload/              # XHR progress + retries
├── schemas/                  # Zod: financial, documents, agent-events
├── stores/                   # tenant, notifications
└── test/                     # Vitest setup
```

## Guardrails (frontend)

- All dashboard figures go through `loadFinancialSummary` → bridge → **`financialSummarySchema.parse`** (or explicit mock flags).
- SSE payloads go through **`agentPipelineMessageSchema`** / `unwrapAgentEvent` before updating the stepper.
- Do **not** call MCP or PostgreSQL from the browser.
- Multi-tenant: middleware sets `x-tenant-id` on **`/dashboard/*`** and **`/api/bridge/*`** from the `tenant_id` cookie.

## Implemented vs still to harden

| Area | Status |
|------|--------|
| Real REST + validation | Bridge + `fetchJsonValidated` / loaders |
| SSE pipeline UI | `useAgentPipelineStream` + mock or FastAPI stream |
| Upload progress / retries | XHR helper; multipart — server must accept large bodies / chunking if needed |
| OCR / parse / validation errors | Typed codes in `PipelineErrorCode` + stepper `Alert` |
| Schema sync with Pydantic | Documented in `docs/openapi-codegen.md`; CI contract tests recommended |
| Drill-down | Links from donut + vendor table → `/dashboard/transactions` |
| Notifications | In-app bell (`notification-store`) — push from upload success/failure |
| Auth / RBAC | Login still placeholder |
| Component/integration tests | Vitest + node tests started; add RTL + `*.test.tsx` when stable |

## Why Next.js (vs Vite SPA)

App Router layouts, middleware for tenant headers, and a first-party BFF for validation/streaming integrate cleanly with this backend. Vite remains suitable for isolated packages or tools.

## License

Private / unlicensed — align with your organization’s policy.
