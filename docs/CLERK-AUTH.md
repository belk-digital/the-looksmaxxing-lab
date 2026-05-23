# CLERK-AUTH.md — Clerk Authentication Integration

> Clerk replaces Payload's built-in customer auth. Payload's admin panel keeps its own auth (Payload email/password) for admin users only. Customers use Clerk. This file explains the full integration.

---

## Architecture

```
CUSTOMER AUTH (Clerk)                 ADMIN AUTH (Payload built-in)
─────────────────────────────         ─────────────────────────────
Clerk handles:                        Payload handles:
  - Sign up / Sign in UI               - /admin login only
  - OAuth (Google, etc.)               - Admin role check
  - MFA / 2FA                          - Admin session cookie
  - Session cookies
  - Email verification
  - Password reset
  - User metadata sync → webhook
         │
         ▼
Payload Users collection
  - clerkUserId (FK)
  - role: 'customer' | 'affiliate'
  - profile data
  - orders, cart, wishlist, etc.
```

**Key rule:** Never mix the two auth systems. Clerk = customers. Payload's own JWT = admins only at `/admin`.

---

## Installation

```bash
npm install @clerk/nextjs
```

Env vars to add (see ENV-VARIABLES.md):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # from Clerk dashboard → Webhooks

# Redirect paths
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/en/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/en/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/en/account
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/en/account
```

---

## Middleware (replaces Phase 4 P-4.6)

`src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const isProtectedRoute = createRouteMatcher([
  '/:locale/account(.*)',
  '/:locale/checkout(.*)',
  '/:locale/affiliates/dashboard(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Let Payload admin routes handle their own auth
  if (isAdminRoute(req)) return NextResponse.next()

  // Protect customer routes
  if (isProtectedRoute(req)) {
    await auth.protect() // Redirects to sign-in if not logged in
  }

  // Run i18n middleware for frontend routes
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
```

---

## Payload Users Collection changes

Add `clerkUserId` as the bridge between Clerk and Payload:

```ts
// src/collections/Users.ts — add to fields array:
{
  name: 'clerkUserId',
  type: 'text',
  unique: true,
  index: true,
  admin: { readOnly: true, description: 'Set by Clerk webhook. Do not edit.' },
  access: { read: () => false }, // Never expose to client
}
```

**Disable Payload auth for customers** — keep auth enabled only for admins:

```ts
// payload.config.ts
export default buildConfig({
  admin: {
    user: 'users',
    // Payload's admin still uses its own auth
  },
  // Do NOT set auth: { ... } globally — let each collection define it
})
```

In Users collection auth config:

```ts
auth: {
  // Keep auth enabled so admins can still use /admin
  // But customers authenticate via Clerk, never via Payload's endpoint
  tokenExpiration: 7200,
},
```

---

## Clerk Webhook → Payload sync

Every Clerk user event fires a webhook to `/api/webhooks/clerk`. This keeps Payload Users in sync.

`src/app/api/webhooks/clerk/route.ts`:

```ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!CLERK_WEBHOOK_SECRET) throw new Error('CLERK_WEBHOOK_SECRET not set')

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(CLERK_WEBHOOK_SECRET)

  let event: any
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const payload = await getPayload({ config })

  switch (event.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name } = event.data
      const email = email_addresses[0]?.email_address

      // Check for existing user (idempotency)
      const existing = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: id } },
      })
      if (existing.docs.length > 0) break

      await payload.create({
        collection: 'users',
        data: {
          clerkUserId: id,
          email,
          firstName: first_name ?? '',
          lastName: last_name ?? '',
          role: 'customer',
          emailVerified: true, // Clerk handles verification
          // Password required by Payload schema — set a random unusable one
          // since Clerk is the auth; no one will ever log in via Payload with this
          password: crypto.randomUUID() + crypto.randomUUID(),
        },
      })
      break
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name } = event.data
      const email = email_addresses[0]?.email_address

      const existing = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: id } },
      })
      if (existing.docs.length === 0) break

      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        data: { email, firstName: first_name ?? '', lastName: last_name ?? '' },
      })
      break
    }

    case 'user.deleted': {
      const { id } = event.data
      const existing = await payload.find({
        collection: 'users',
        where: { clerkUserId: { equals: id } },
      })
      if (existing.docs.length === 0) break

      // Soft delete: set a deletedAt field rather than hard delete
      // (orders/affiliates data must be preserved)
      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        data: { role: 'deleted' as any },
      })
      break
    }
  }

  return new Response('OK', { status: 200 })
}
```

**Register this webhook in Clerk dashboard:**

- URL: `https://yoursite.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

---

## Helper: get Payload user from Clerk session

Create `src/lib/auth/getPayloadUser.ts`:

```ts
import { auth } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'

export async function getPayloadUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'users',
    where: { clerkUserId: { equals: userId } },
    limit: 1,
  })

  return result.docs[0] ?? null
}
```

Use in any server component or server action:

```ts
// In a server component
const user = await getPayloadUser()
if (!user) redirect('/en/login')
```

---

## UI components

Replace all custom auth pages with Clerk's components:

```ts
// src/app/(frontend)/[locale]/login/page.tsx
import { SignIn } from '@clerk/nextjs'
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}

// src/app/(frontend)/[locale]/register/page.tsx
import { SignUp } from '@clerk/nextjs'
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```

Clerk handles: email verification, password strength, marketing opt-in (add as custom field in Clerk → metadata), OAuth buttons, error states, loading states — everything. You build zero auth UI from scratch.

**Customize Clerk appearance** to match your brand:

```ts
// In ClerkProvider (root layout)
<ClerkProvider
  appearance={{
    variables: {
      colorPrimary: '#YOUR_BRAND_COLOR',
      borderRadius: '0.5rem',
    },
    elements: {
      formButtonPrimary: 'bg-primary hover:bg-primary/90',
    }
  }}
>
```

---

## User button (header)

Replace custom user menu with Clerk's `<UserButton>`:

```ts
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

// In header:
<SignedIn>
  <UserButton afterSignOutUrl="/en/" />
</SignedIn>
<SignedOut>
  <Link href="/en/login">Sign in</Link>
</SignedOut>
```

Or build your own dropdown using `useUser()` hook for full control.

---

## Accessing user in server actions

```ts
'use server'
import { auth } from '@clerk/nextjs/server'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'

export async function someProtectedAction(data: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const user = await getPayloadUser()
  if (!user) throw new Error('User not found in database')

  // Now you have: userId (Clerk), user (Payload User doc with id, email, role, etc.)
}
```

---

## Marketing opt-in (Clerk custom metadata)

In Clerk dashboard → Configure → User metadata:

- Add public metadata field: `acceptsMarketing: boolean`

On sign-up, add a custom Clerk field or capture post-registration:

- After first login, show a one-time "marketing preferences" modal
- Server action updates Clerk public metadata via Clerk Backend API
- Clerk webhook updates Payload User record with acceptsMarketing

---

## What Clerk handles (you don't build)

- ✅ Login / Register UI
- ✅ Email verification
- ✅ Password reset / forgot password
- ✅ Session management + refresh
- ✅ "Remember me" / session expiry
- ✅ OAuth (Google, GitHub, etc.)
- ✅ MFA / 2FA (TOTP or SMS)
- ✅ Rate limiting on login attempts
- ✅ Brute force protection
- ✅ Suspicious login detection
- ✅ GDPR user deletion

## What you still build

- ✅ Webhook to sync Clerk user → Payload User
- ✅ `getPayloadUser()` helper
- ✅ Account pages (orders, addresses, wishlist) — data from Payload
- ✅ Affiliate dashboard — data from Payload
- ✅ Custom user preferences (marketing, locale) — stored in Payload

---

## Phases affected by Clerk switch

- **Phase 4** is now drastically simplified — skip P-4.2 through P-4.5 (register, login, logout, password reset are all handled by Clerk). Only build:
  - P-4.1 (Resend for transactional emails — still needed)
  - Clerk webhook route
  - `getPayloadUser()` helper
  - Middleware (updated above)
- **Phase 13** (customer dashboard) remains the same — all account data lives in Payload

---

## Pricing note

Clerk is free up to 10,000 Monthly Active Users. After that: ~$0.02/MAU. For a new peptide store, you will not hit this limit for months. Free tier is genuinely free, not crippled.
