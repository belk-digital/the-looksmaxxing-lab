import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Try to force a database schema push
    let pushResult = 'skipped'
    try {
      if (typeof payload.db.push === 'function') {
        await payload.db.push()
        pushResult = 'success'
      }
    } catch (e: any) {
      pushResult = 'failed: ' + e.message
    }
    
    // Try to read it
    const settings = await payload.findGlobal({
      slug: 'affiliate-settings',
      overrideAccess: true,
    })
    
    return NextResponse.json({ success: true, pushResult, settings })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack })
  }
}
