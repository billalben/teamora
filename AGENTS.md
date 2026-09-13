# AGENTS.md

## Quick commands

```bash
pnpm dev          # start dev server
pnpm build        # production build (also typechecks)
pnpm lint         # eslint
pnpm format       # prettier on all files
pnpm knip         # dead-code / unused-dependency check
pnpm knip:md      # knip output to markdown
```

- **No `pnpm typecheck` script.** TypeScript is validated at build time by Next.js (`pnpm build`). If you need standalone typechecking, run `npx tsc --noEmit`.
- **No test suite.** There are no test files, no Jest/Vitest config, and no `test` script in this repo.

## Package manager

Always use **pnpm**. The lockfile is `pnpm-lock.yaml`.

## Architecture

### oRPC API layer (not REST or tRPC)

All backend procedures live under `app/router/`. The router tree is composed in `app/router/index.ts` and served via the catch-all handler at `app/rpc/[[...rest]]/route.ts`.

- **Server-side client**: initialized in `lib/orpc.server.ts` (imported by `instrumentation.ts` and `app/layout.tsx` for pre-rendering). Provides a global `$client` for SSR fetching.
- **Client-side client**: `lib/orpc.ts` creates an oRPC link to `/rpc` (browser only) and exports `orpc` (TanStack Query utils) for use in components.
- **Middlewares**: defined in `app/middlewares/` using `os` from `@orpc/server`. The `base` middleware defines standard error types. Auth (`auth.ts`) validates Kinde sessions; workspace (`workspace.ts`) validates Kinde org membership.

### Auth (Kinde)

Kinde manages authentication and organizations. Kinde **organizations are used as workspaces** — workspace IDs are Kinde org IDs.

- `proxy.ts` (Next.js 16 proxy-based middleware) wraps all non-static routes through Arcjet bot detection and Kinde auth.
- `/` and `/api/uploadthing` are marked as public paths.
- The route group `(dashboard)` is behind auth; `(marketing)` is public.

### Generated code

- **Prisma client** outputs to `lib/generated/prisma/` (not `node_modules/.prisma/client`). Imported as `@/lib/generated/prisma/client` in `lib/prisma.ts`.
- Run `npx prisma generate` to regenerate after schema changes, then `npx prisma migrate dev` for migrations.

### Database

PostgreSQL via `@prisma/adapter-pg` with `DATABASE_URL` from env. No connection pooling library — uses the `pg` driver directly through Prisma's adapter.

### File uploads

UploadThing handles file uploads. The router is defined in `app/api/uploadthing/core.ts`. The `utapi` instance (`lib/uploadthing-server.ts`) is used for server-side operations like deletion. `/api/uploadthing` is excluded from Arcjet/Kinde middleware.

### TanStack Query

Custom query client (`lib/query/client.ts`) uses oRPC's `StandardRPCJsonSerializer` for proper serialization of BigInt, Map, Set, etc. Server-side hydration uses the cached `getQueryClient` from `lib/query/hydration.tsx`.

## Git conventions

- **Commit messages**: conventional commits enforced via `commitlint` (husky `commit-msg` hook).
- **Pre-commit**: `lint-staged` runs `eslint` on `.ts/.tsx/.js/.jsx` files and `prettier --write` on a broader set of file types.
- **Prettier**: double quotes (`singleQuote: false`), semicolons, `printWidth: 120`, `trailingComma: "es5"`.

## UI

shadcn/ui (New York style) with `components.json`. Components live in `components/ui/`. The `@/*` alias maps to the project root.
