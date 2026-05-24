// src/app/api/auth/forgot-password/route.ts

import { NextResponse } from 'next/server'
import { forgotPassword } from '@/lib/auth/forgotPassword'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    await forgotPassword(email)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    console.error('Forgot password API error:', err)
    return NextResponse.json({ message: err?.message || 'Forgot password failed' }, { status: 400 })
  }
}
