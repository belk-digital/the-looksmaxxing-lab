// src/app/api/auth/reset-password/route.ts

import { NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth/resetPassword'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    await resetPassword(token, password)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    console.error('Reset password API error:', err)
    return NextResponse.json({ message: err?.message || 'Reset password failed' }, { status: 400 })
  }
}
