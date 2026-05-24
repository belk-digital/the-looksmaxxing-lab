// src/app/api/auth/[...nextauth]/route.ts

import { authOptions, handler } from '@/lib/auth/nextauth'

/**
 * Next.js App Router API route for NextAuth.
 * The `handler` exported from nextauth.ts is wrapped here to satisfy the
 * App Router's file‑based routing expectations.
 */
export const GET = handler
export const POST = handler
