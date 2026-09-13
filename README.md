# Teamora

**The AI-ready home for team communication.**

Teamora is a realtime team chat application where conversations are organized into channels and threads, synced instantly across everyone in the room, and supported by AI that summarizes discussions and sharpens your writing.

**Live demo:** [https://teamora.billalbenz.com](https://teamora.billalbenz.com)

---

## Table of contents

- [What is Teamora?](#what-is-teamora)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Security](#security)
- [Engineering highlights](#engineering-highlights)
- [Deployment](#deployment)

---

## What is Teamora?

Team communication tools tend to force a trade-off: either they are simple but lose important context, or they are powerful but slow and overwhelming. Teamora is built around a different idea — keep every conversation in a clear, structured place, and let AI remove the busywork of keeping up with it.

Team members create a **workspace**, organize discussions into **channels**, and break side conversations into **threads**. Everything is **realtime**, so messages, replies, and reactions appear the moment they happen, and **presence** shows who is around. When a thread has grown long, one click produces an **AI summary** of the decisions and next steps. While writing, an **AI assistant** can rewrite a draft into something clearer — without touching links or code blocks.

It is designed for small product and engineering teams who want a focused, fast alternative to heavyweight chat platforms, and it is built as a production-style application with authentication, rate limiting, security, and edge realtime infrastructure.

### At a glance

- Realtime messaging with channels, threads, and emoji reactions
- AI thread summaries and an AI compose assistant, streamed as they are generated
- Live presence so you always know who is online
- Rich text composer with formatting and syntax-highlighted code
- Image sharing with a built-in lightbox
- Multi-tenant workspaces backed by authentication and organization management
- Soft-delete with undo, so an accidental delete is recoverable

---

## Features

### Communication

- **Channels** — organize conversations by team, project, or topic so context never gets lost.
- **Threads & replies** — keep side discussions out of the main channel and follow them through to resolution.
- **Rich composer** — write with formatting, lists, and syntax-highlighted code blocks, powered by a Tiptap editor.
- **Reactions** — react with emoji for quick, low-noise feedback.
- **Image sharing** — attach screenshots and images and view them full size in a lightbox.
- **Soft-delete & restore** — deleting a message hides it as a tombstone; the author can restore it, and anyone else can never read the original body.

### Realtime

- Messages, replies, and reactions sync instantly for everyone in a channel.
- Live presence shows who is online and active.
- Optimistic updates mean your own messages appear immediately — the server never echoes an event back to the sender.
- Built on Cloudflare Durable Objects via PartyKit's `partyserver`, with connection hibernation for efficiency.

### AI

- **Thread summaries** — reads the root message and every reply, then streams back a short summary with decisions and next steps. Summaries are grounded in the thread only, so facts are never invented, and names, ticket IDs, and terminology are preserved.
- **Compose assistant** — rewrites and tightens a draft in place while leaving links and code blocks untouched. Suggestions can be accepted or declined before sending.
- Model-agnostic: powered by any model available through OpenRouter.

### Workspaces & access

- Workspaces are backed by authentication provider organizations, with members and roles managed through the provider's management API.
- Members can be invited by email directly from the workspace.
- Every request is authenticated and scoped to the active workspace.

---

## Tech stack

| Layer          | Technologies                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router, Turbopack), React 19, TypeScript                                                    |
| **API**        | oRPC (`@orpc/server`, `@orpc/client`), TanStack Query v5, Zod                                               |
| **Database**   | PostgreSQL, Prisma 7, `@prisma/adapter-pg` (`pg` driver)                                                    |
| **Auth**       | Kinde (authentication + organizations as workspaces), Kinde Management API                                  |
| **Realtime**   | Cloudflare Workers + Durable Objects, PartyKit / `partyserver`, `partysocket`                               |
| **AI**         | Vercel AI SDK, `@openrouter/ai-sdk-provider`                                                                |
| **Files**      | UploadThing                                                                                                 |
| **Security**   | Arcjet (bot detection, shield, rate limiting, sensitive-info detection)                                     |
| **UI**         | Tailwind CSS v4, shadcn/ui (New York), Base UI, `motion` animations, `next-themes`, Lucide icons            |
| **Editor**     | Tiptap (StarterKit, code blocks, text alignment, static renderer), `lowlight`, `streamdown` for AI markdown |
| **Tooling**    | ESLint, Prettier, Husky, commitlint (conventional commits), lint-staged, Knip, Wrangler                     |
| **Deployment** | Next.js host + Cloudflare Worker for realtime                                                               |

---

## Architecture

Teamora is a single Next.js application that also owns a type-safe RPC layer, with a separate Cloudflare Worker handling realtime traffic.

```
┌──────────────────────────────────────────────────────────────────────┐
│                              Browser                                 │
│   React 19 components · TanStack Query · partysocket (WebSocket)      │
└───────────────┬──────────────────────────────────┬───────────────────┘
                │ HTTPS /rpc (oRPC)                │ WebSocket
                ▼                                  ▼
┌──────────────────────────────┐      ┌────────────────────────────────┐
│      Next.js 16 (App Router) │      │  Cloudflare Worker             │
│                              │      │  Durable Object: Chat          │
│  proxy.ts                    │      │  · presence tracking           │
│   · Arcjet bot detection     │      │  · event broadcast             │
│   · Kinde auth (public paths)│      │  · connection hibernation      │
│                              │      └────────────────────────────────┘
│  /rpc/[[...rest]]/route.ts   │
│   └── RPCHandler(router)     │
│        ├── auth middleware   │
│        ├── workspace middle. │
│        └── Arcjet middlewares│
│                              │
│  Prisma 7 ──► PostgreSQL     │        AI: OpenRouter (streamed)
└──────────────────────────────┘
```

### Request flow (oRPC)

1. Every backend procedure is defined with `base` in `app/router/` and composed into a single router tree in `app/router/index.ts`.
2. The tree is served over a catch-all handler at `app/rpc/[[...rest]]/route.ts` using oRPC's `RPCHandler`.
3. Procedures are built from middleware chains: **authentication** (`app/middlewares/auth.ts`) → **workspace scoping** (`app/middlewares/workspace.ts`) → **Arcjet security** (`app/middlewares/arcjet/*`).
4. The browser client (`lib/orpc.ts`) talks to `/rpc` and exposes TanStack Query utilities. During server rendering, a global `$client` (`lib/orpc.server.ts`) provides the same typed client, so components can fetch on both sides with identical types.

### Realtime model

- Each chat room runs in a Cloudflare **Durable Object** (`realtime/index.ts`), giving a single source of truth per room.
- Presence is tracked on connection state and broadcast to all clients; user info is validated with Zod.
- Realtime events are broadcast to every connection **except the sender**, because the sender has already applied the change optimistically.
- Connections can **hibernate**, keeping long-lived channels efficient.

### Data & deletion semantics

- Messages support a self-referencing thread relation; replies point at a root message, and replies cannot themselves be threaded.
- Deletion is a soft delete (`deletedAt`). Readers of a deleted message receive a redacted tombstone with content and image removed, so a deleted body is never exposed through any endpoint. Restoring a message clears the tombstone, though the attached image is not recoverable.

---

## Project structure

```
teamora/
├── app/
│   ├── (marketing)/            # Public marketing site
│   ├── (dashboard)/            # Authenticated app: workspace, channels, chat
│   ├── api/uploadthing/        # UploadThing file router
│   ├── middlewares/            # oRPC middleware: auth, workspace, arcjet/*
│   ├── router/                 # oRPC procedures (workspace, channel, message, member, attachment, ai)
│   ├── rpc/[[...rest]]/        # oRPC catch-all HTTP handler
│   └── schemas/                # Shared Zod schemas
├── components/                 # UI components (shadcn/ui + app components)
├── hooks/                      # Reusable React hooks
├── lib/                        # oRPC clients, Prisma, env, serializers, helpers
│   └── generated/prisma/       # Generated Prisma client
├── providers/                  # React context providers
├── prisma/
│   └── schema.prisma           # Data model
├── realtime/
│   └── index.ts                # Cloudflare Durable Object (PartyKit server)
├── proxy.ts                    # Next.js proxy middleware (Arcjet + Kinde)
├── wrangler.jsonc              # Cloudflare Worker configuration
└── prisma.config.ts
```

---

## Getting started

### Prerequisites

- **Node.js** 20 or newer
- **pnpm** (this project uses pnpm exclusively; the lockfile is `pnpm-lock.yaml`)
- A **PostgreSQL** database
- Accounts for the following services:
  - [Kinde](https://kinde.com) — authentication and organizations
  - [Arcjet](https://arcjet.com) — bot detection and rate limiting
  - [UploadThing](https://uploadthing.com) — file uploads
  - [OpenRouter](https://openrouter.ai) — AI model access

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env
# then fill in the values described in the Environment variables section

# 3. Generate the Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# 4. Start the Next.js dev server
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Realtime server (optional)

Realtime runs in a separate Cloudflare Worker. To develop it locally:

```bash
pnpm wrangler:dev      # run the Worker locally (default: http://localhost:8787)
pnpm wrangler:types    # regenerate runtime types after changing wrangler.jsonc
```

Set `NEXT_PUBLIC_PARTYKIT_HOST` to the Worker's address so the client connects to it.

---

## Environment variables

Copy `.env.example` to `.env` and provide the following values.

| Variable                         | Scope  | Description                                                   |
| -------------------------------- | ------ | ------------------------------------------------------------- |
| `KINDE_CLIENT_ID`                | Server | Kinde application client ID                                   |
| `KINDE_CLIENT_SECRET`            | Server | Kinde application client secret                               |
| `KINDE_ISSUER_URL`               | Server | Kinde issuer URL                                              |
| `KINDE_SITE_URL`                 | Server | Canonical application URL                                     |
| `KINDE_POST_LOGOUT_REDIRECT_URL` | Server | Where users land after logging out                            |
| `KINDE_POST_LOGIN_REDIRECT_URL`  | Server | Where users land after logging in                             |
| `KINDE_DOMAIN`                   | Server | Kinde domain used for management operations                   |
| `KINDE_MANAGEMENT_CLIENT_ID`     | Server | Kinde Management API client ID (workspaces, members, invites) |
| `KINDE_MANAGEMENT_CLIENT_SECRET` | Server | Kinde Management API client secret                            |
| `ARCJET_KEY`                     | Server | Arcjet API key                                                |
| `DATABASE_URL`                   | Server | PostgreSQL connection string                                  |
| `UPLOADTHING_TOKEN`              | Server | UploadThing API token                                         |
| `LLM_KEY`                        | Server | OpenRouter API key                                            |
| `LLM_MODEL`                      | Server | OpenRouter model ID (defaults to a free-tier model)           |
| `NEXT_PUBLIC_PARTYKIT_HOST`      | Client | Public host of the realtime Cloudflare Worker                 |

Environment variables are validated at startup with `@t3-oss/env-nextjs` and Zod (`lib/env.ts`), so the app fails fast on misconfiguration.

---

## Available scripts

| Command                | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `pnpm dev`             | Start the development server with Turbopack               |
| `pnpm build`           | Production build (also runs TypeScript checks)            |
| `pnpm start`           | Start the production server                               |
| `pnpm lint`            | Run ESLint                                                |
| `pnpm format`          | Format all files with Prettier                            |
| `pnpm knip`            | Detect dead code and unused dependencies                  |
| `pnpm knip:md`         | Write Knip output to `knip-report.md`                     |
| `pnpm wrangler:dev`    | Run the realtime Cloudflare Worker locally                |
| `pnpm wrangler:types`  | Generate Worker runtime types after configuration changes |
| `pnpm wrangler:deploy` | Deploy the realtime Worker to Cloudflare                  |
| `pnpm wrangler:tail`   | Stream live logs from the deployed Worker                 |

> TypeScript is validated during `pnpm build`. For a standalone type check, run `npx tsc --noEmit`.

---

## API reference

All procedures are defined with oRPC and served from `/rpc`. Every procedure below is type-safe end to end — request and response types are inferred on the client directly from the router.

### Workspace & members

| Procedure                 | Method | Path                        | Description                          |
| ------------------------- | ------ | --------------------------- | ------------------------------------ |
| `workspace.list`          | GET    | `/workspace`                | List the user's workspaces           |
| `workspace.create`        | POST   | `/workspace`                | Create a workspace and join as admin |
| `workspace.member.list`   | GET    | `/workspace/members`        | List members of the active workspace |
| `workspace.member.invite` | POST   | `/workspace/members/invite` | Invite a member by email             |

### Channels

| Procedure        | Method | Path                   | Description                         |
| ---------------- | ------ | ---------------------- | ----------------------------------- |
| `channel.list`   | GET    | `/channels`            | List channels and workspace members |
| `channel.create` | POST   | `/channel`             | Create a channel                    |
| `channel.get`    | GET    | `/channels/:channelId` | Get a channel by ID                 |

### Messages, threads & reactions

| Procedure                 | Method | Path                             | Description                        |
| ------------------------- | ------ | -------------------------------- | ---------------------------------- |
| `message.create`          | POST   | `/messages`                      | Create a message or thread reply   |
| `message.list`            | GET    | `/messages`                      | Cursor-paginated channel messages  |
| `message.update`          | PUT    | `/messages/:messageId`           | Edit an authored message           |
| `message.delete`          | DELETE | `/messages/:messageId`           | Soft-delete an authored message    |
| `message.restore`         | POST   | `/messages/:messageId/restore`   | Restore a soft-deleted message     |
| `message.thread.list`     | GET    | `/messages/:messageId/thread`    | List a thread's parent and replies |
| `message.reaction.toggle` | POST   | `/messages/:messageId/reactions` | Toggle an emoji reaction           |

### Attachments

| Procedure                 | Method | Path                  | Description                           |
| ------------------------- | ------ | --------------------- | ------------------------------------- |
| `attachment.deleteUpload` | POST   | `/attachments/delete` | Delete a staged upload before sending |

### AI

| Procedure                    | Method | Path                   | Description                      |
| ---------------------------- | ------ | ---------------------- | -------------------------------- |
| `ai.thread.summary.generate` | GET    | `/ai/thread/summary`   | Stream a summary of a thread     |
| `ai.compose.generate`        | POST   | `/ai/compose/generate` | Stream a rewritten message draft |

---

## Data model

The schema (`prisma/schema.prisma`) is intentionally small and relies on the authentication provider as the source of truth for users and workspaces. Kinde organization codes are stored as workspace IDs, and Kinde user IDs as author IDs — there is no local user table.

- **Channel** — belongs to a workspace; unique by `[workspaceId, name]`. Tracks the creating user.
- **Message** — belongs to a channel and carries denormalized author details (name, email, avatar) so history renders without extra lookups. Self-references via a `threadId` relation to form threads. Soft-deleted with `deletedAt`; indexed on `channelId`.
- **MessageReaction** — links an emoji to a message for a user, unique per `[userId, messageId, emoji]`, and cascades on message deletion.

Referential integrity is enforced with cascading deletes on channels and messages.

---

## Security

Security is enforced in depth rather than at a single gateway.

- **Bot detection at the edge** — `proxy.ts` runs Arcjet bot detection on every non-static route, allowlisting search engines, monitors, previews, and trusted webhooks. UploadThing callbacks are explicitly excluded.
- **Authenticated routes** — Kinde wraps the app; only `/` and `/api/uploadthing` are public. The dashboard route group requires a session.
- **Workspace scoping** — the workspace middleware resolves the active organization, and every data query is filtered by it so procedures can never read or mutate another workspace's data.
- **Tiered rate limiting** — Arcjet sliding-window rules are applied per operation class: reads (180/min), writes (40/min), heavy writes (2/min), and AI generation (3/min). Sensitive-info detection runs on write and AI paths.
- **Input validation** — every procedure validates input with Zod schemas in `app/schemas/`.
- **Safe deletion** — soft deletes are redacted before leaving the server, so deleted content is never recoverable by other members.

---

## Engineering highlights

- **Type-safe API end to end** — oRPC procedures are inferred on the client, so requests, responses, and errors share a single source of truth without hand-written types or code generation.
- **One client for server and browser** — the same router client powers SSR prefetching (`lib/orpc.server.ts`) and browser queries (`lib/orpc.ts`), rendered through TanStack Query.
- **Custom serialization** — a query client using oRPC's `StandardRPCJsonSerializer` correctly transports `BigInt`, `Map`, `Set`, and other values that JSON would otherwise lose.
- **Streaming AI over RPC** — AI responses are returned as oRPC event iterators and streamed to the UI as they are generated, rather than waiting for a full completion.
- **Edge realtime** — presence and message events are handled by a single Cloudflare Durable Object per room with connection hibernation, avoiding polling and server fan-out.
- **Explicit deletion semantics** — soft delete plus redaction gives users an undo without ever exposing deleted content.
- **Quality tooling** — conventional commits enforced by commitlint, pre-commit lint/format via Husky and lint-staged, and Knip for dead-code and unused-dependency detection.

---

## Deployment

Teamora deploys as two pieces:

1. **Next.js application** — build with `pnpm build` and deploy to any Node-compatible host (for example Vercel). Provide all server and client environment variables from the [Environment variables](#environment-variables) section.
2. **Realtime Worker** — deploy the Cloudflare Worker with `pnpm wrangler:deploy`, then set `NEXT_PUBLIC_PARTYKIT_HOST` in the Next.js app to the deployed Worker host.

Run `npx prisma migrate deploy` against the production database before starting the application.
