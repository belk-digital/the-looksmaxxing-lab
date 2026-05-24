// src/app/api/auth/me/route.ts

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json({ ok: true, user }, { status: 200 })
  } catch (err: any) {
    console.error('Me API error:', err)
    return NextResponse.json({ message: err?.message || 'Error' }, { status: 500 })
  }
}
