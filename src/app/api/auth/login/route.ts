// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import { login } from '@/lib/auth/login'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const result = await login(email, password)
    // Payload returns a token; we forward it as a cookie (httpOnly) manually.
    const response = NextResponse.json({ ok: true, user: result }, { status: 200 })
    // If `result?.token` exists, set it as httpOnly cookie.
    if (result && (result as any).token) {
      const token = (result as any).token
      response.cookies.set('payload-token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Use a reasonable max age (e.g., 30 days).
        maxAge: 30 * 24 * 60 * 60,
      })
    }
    return response
  } catch (err: any) {
    console.error('Login API error:', err)
    return NextResponse.json({ message: err?.message || 'Login failed' }, { status: 400 })
  }
}
