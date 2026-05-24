// src/app/api/auth/register/route.ts

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { register } from '@/lib/auth/register'

export const runtime = 'nodejs' // ensure server‑only
export async function POST(request: Request) {
  // Initialise Payload with the project's config
  const payload = await getPayload({ config })
  try {
    const { email, password, firstName, lastName, acceptsMarketing, provider } =
      await request.json()

    // Pass the initialised payload instance to the helper
    const result = await register(payload, {
      email,
      password,
      firstName,
      lastName,
      acceptsMarketing,
      provider,
    })

    return NextResponse.json({ ok: true, user: result }, { status: 201 })
  } catch (err: any) {
    console.error('Register API error:', err)
    return NextResponse.json({ message: err?.message || 'Registration failed' }, { status: 400 })
  }
}
