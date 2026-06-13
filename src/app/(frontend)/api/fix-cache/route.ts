import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/admin/globals/affiliate-settings')
  return NextResponse.json({ revalidated: true, message: 'Admin cache cleared' })
}
