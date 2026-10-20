/**
 * Proves the BLOCK_EMAILS=true kill switch through the real Payload setup: the email is NOT sent, and a copy is saved locally.
 * A fake Resend key is used so nothing can ever reach Resend:
 *   BLOCK_EMAILS=true RESEND_API_KEY=re_fake_never_used npx tsx scripts/subscriptions/check-email-guard.ts
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'

if (process.env.BLOCK_EMAILS !== 'true') throw new Error('run this with BLOCK_EMAILS=true (and a fake RESEND_API_KEY)')
const payload = await getPayload({ config })
const dir = path.join(process.cwd(), '.local-test', 'blocked-emails')
const before = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0
const res: any = await payload.sendEmail({ to: 'nobody@example.com', bcc: 'admin-copy@example.com', subject: 'Guard test - must NOT be sent', html: '<p>test</p>' })
const after = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0
const ok = res?.id === 'blocked-by-setting' && after === before + 1
console.log(ok ? 'PASS  email was blocked and saved locally' : `FAIL  result=${JSON.stringify(res)} files ${before}->${after}`)
process.exit(ok ? 0 : 1)
