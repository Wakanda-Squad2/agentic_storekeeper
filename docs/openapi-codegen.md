# Keeping TypeScript Zod types aligned with FastAPI (OpenAPI)

Drift between `src/schemas/*.ts` (Zod) and Pydantic models is the main source of production bugs for this stack. Pick **one** source of truth and generate the other.

## Option A — OpenAPI → TypeScript types (quick win)

1. Expose OpenAPI JSON from FastAPI (`/openapi.json`).
2. Run codegen whenever the API changes:

   ```bash
   npx openapi-typescript https://agentic-storekeeper-backend.onrender.com/openapi.json -o src/schemas/generated/openapi.d.ts
   ```

3. Wrap critical endpoints with thin Zod validators that match the same shapes (or use tools that emit Zod from OpenAPI).

## Option B — Shared JSON Schema package (strictest)

1. Maintain JSON Schema files for agent outputs and REST DTOs in a small shared repo (or `packages/contracts`).
2. Generate **both** Pydantic and Zod (or TypeScript) from those schemas in CI.
3. Version the package; bump when making breaking agent or API changes.

## Option C — Contract tests

Add CI step: call FastAPI with fixtures, assert responses validate against your Zod schemas (or vice versa with Pydantic parse of golden JSON files).

## Bridge routes

`src/app/api/bridge/**` validates financial summaries and document lists **after** upstream fetch. If validation fails, the UI gets `502` with `schema_mismatch` — fix either backend or Zod, not the charts.
