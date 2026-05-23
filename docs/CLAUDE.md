# CLAUDE.md — AI Assistant Rules for This Project

> This file is auto-loaded by Claude Code, Cursor (`.cursorrules`), and Windsurf. It tells the AI how to behave on this codebase.

## Project identity

You are working on a **bilingual (EN/ES) peptides e-commerce store** for the USA market.

**Stack (non-negotiable, do not suggest alternatives unless asked):**

- Next.js 15 (App Router)
- Payload CMS 3.0 (integrated, lives in same Next.js app)
- TypeScript (strict mode)
- PostgreSQL (Neon serverless)
- Tailwind CSS + shadcn/ui
- Stripe (payments)
- Resend (email)
- Cloudflare R2 (file storage)
- next-intl (i18n)
- npm (package manager — NEVER use pnpm or yarn commands)

## Core rules

### Rule 1: Read context before acting

Before any non-trivial change, you MUST read:

- `/docs/PROJECT-CONTEXT.md`
- `/docs/SCHEMAS.md` (if touching data models)
- `/docs/FEATURES.md` (if touching features)

If you have not read them this session, say so and read them first.

### Rule 2: One task per response

Do exactly what is asked. Do not bundle "while I'm here" refactors. If you see a problem outside scope, mention it in one line at the end — do not fix it.

### Rule 3: Show file paths in every change

Every code block must start with the absolute file path as a comment:

```ts
// src/collections/Products.ts
```

### Rule 4: Never break existing functionality

Before modifying a file, read the full file. If a function has callers, list them and confirm the change is safe. Never delete code you don't understand.

### Rule 5: Money, security, and PII require extra care

For any code touching:

- Payments (Stripe, refunds, prices)
- Authentication (login, tokens, sessions)
- Authorization (access control, roles)
- Customer PII (addresses, emails, orders)

You MUST:

1. State the security/correctness concern up front
2. Reference the relevant section of `/docs/PROJECT-CONTEXT.md`
3. Add inline comments explaining why each non-obvious line exists
4. Suggest at least one test case

### Rule 6: Use existing patterns

If a pattern exists in the codebase (e.g., how other collections are structured, how server actions are written), follow it exactly. Do not invent new patterns.

### Rule 7: TypeScript strict

- No `any` unless absolutely forced
- No `@ts-ignore` — use `@ts-expect-error` with explanation
- Use Payload's generated types (`import { Product } from '@/payload-types'`)
- Run `npm run generate:types` after any collection schema change

### Rule 8: Bilingual everywhere

Every user-facing string MUST be:

- In a translation file (`messages/en.json` and `messages/es.json`), OR
- A localized Payload field (set `localized: true`)

Never hardcode user-facing English in components.

### Rule 9: Server components by default

- Pages and layouts: server components
- Forms with state: client components (`'use client'`)
- Data fetching: server components or server actions
- Never fetch from client when server-side is possible

### Rule 10: Accessibility is not optional

- Every interactive element has a keyboard path
- Every image has alt text (from Payload's media collection)
- Every form input has a label
- Color contrast must be WCAG AA minimum

## Package management

- Install: `npm install <pkg>`
- Dev install: `npm install -D <pkg>`
- Scripts: `npm run <script>`
- NEVER use `pnpm` or `yarn` commands.

## Commit conventions

Use Conventional Commits:

- `feat: add wishlist drawer`
- `fix: prevent double-add to cart on slow network`
- `refactor: extract checkout step components`
- `docs: update SCHEMAS.md with Reviews collection`
- `chore: bump payload to 3.0.5`

Each commit should be one logical change. Do not batch.

## File naming

- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatPrice.ts`)
- Server actions: `actions.ts` colocated with the page
- Payload collections: `PascalCase.ts` (e.g., `Products.ts`)
- Test files: `*.test.ts`
- Route folders: `kebab-case` (e.g., `app/order-confirmation/`)

## When stuck or unsure

1. Say so explicitly: "I'm uncertain about X because Y."
2. Propose 2 options with tradeoffs.
3. Ask before guessing on anything involving money, auth, or data integrity.
4. Never silently make assumptions about business logic.

## Output discipline

- No emoji in code
- No console.log in committed code (use a logger or remove)
- No commented-out code in commits
- No TODO comments without an issue link or owner

## Performance budgets

- LCP: < 2.5s on 4G mobile
- Total JS on a PDP: < 200KB gzipped
- Images: WebP or AVIF, sized to viewport, lazy below the fold
- No client-side data fetch for content that doesn't change per-user

## Final reminder

This is real money, real customers, real legal exposure. Code as if you were going to pay for the bugs.
