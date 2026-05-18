# BloodConnect — بنك الدم - مستشفى غريان المركزي

نظام إدارة بنك الدم لمستشفى غريان المركزي — يربط المتبرعين بالمرضى ويدير المخزون والتبرعات والطلبات.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/blood-bank run dev` — run the frontend (port 22377)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Wouter + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM database schema
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/blood-bank/src/pages/` — React pages
- `attached_assets/` — static images and assets

## Architecture decisions

- Contract-first API: OpenAPI spec gates codegen, which gates the frontend — spec is the single source of truth
- Role-based access: Donor / Staff / Admin roles with protected routes
- JWT auth via `Authorization: Bearer` header (stored in localStorage)
- Arabic-first UI with RTL layout support
- Monorepo: shared `@workspace/api-client-react` used by frontend for typed API calls

## Product

- **متبرعون (Donors)**: تسجيل، لوحة تحكم، استعراض طلبات الدم، الردود على النداءات، الملف الشخصي
- **موظفون (Staff)**: إدارة المتبرعين والمرضى وطلبات الدم والتبرعات والمخزون
- **مسؤولون (Admins)**: كل صلاحيات الموظفين + إدارة المستخدمين وتعيين الأدوار
- **عام**: الصفحة الرئيسية، عرض طلبات الدم العامة، تسجيل حساب جديد

## User preferences

- المشروع مستورد من GitHub: https://github.com/jihadbil/BloodConnect.git
- واجهة المستخدم باللغة العربية بالكامل

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- The API server does NOT yet have route implementations — only the health endpoint works
- DB schema in `lib/db/src/schema/index.ts` is empty and needs to be populated

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
