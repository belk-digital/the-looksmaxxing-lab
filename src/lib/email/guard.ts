import type { EmailAdapter, SendEmailOptions } from 'payload'

/**
 * Emails (order confirmations, invoices, admin alerts...) are sent by every server, including `pnpm dev` / `npm run dev`,
 * so you can see exactly what customers receive while testing.
 *
 * Optional kill switch: set BLOCK_EMAILS=true (for example in .env.local) and NO email is sent. Instead a line is printed in the
 * terminal and a readable HTML copy is saved in `.local-test/blocked-emails/`. Use it when the website is connected to the
 * live database and you do not want any customer or admin to be emailed (for example while changing real orders).
 *
 * Note: while connected to the LIVE database, anything that emails customers (placing an order with a real customer's address,
 * changing a real order's status in the admin, running the cron jobs) sends a real email.
 */
export function emailsAreBlocked(env: Record<string, string | undefined> = process.env): boolean {
  return env.BLOCK_EMAILS === 'true'
}

const asList = (v: unknown): string =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .map((x) => (typeof x === 'string' ? x : (x as { address?: string })?.address || ''))
    .filter(Boolean)
    .join(', ')

async function saveBlockedCopy(message: SendEmailOptions) {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const dir = path.join(process.cwd(), '.local-test', 'blocked-emails')
    fs.mkdirSync(dir, { recursive: true })
    const slug = String(message.subject || 'email').replace(/[^a-z0-9]+/gi, '-').slice(0, 60)
    const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${slug}.html`)
    const header = `<!-- NOT SENT (BLOCK_EMAILS=true). to: ${asList(message.to)} | bcc: ${asList(message.bcc)} | subject: ${message.subject} -->\n`
    fs.writeFileSync(file, header + String(message.html || message.text || ''))
  } catch {
    // saving a preview must never break an order
  }
}

/** Wraps a Payload email adapter so that it only really sends when `emailsAreBlocked()` is false. */
export function guardEmailAdapter(factory: EmailAdapter): EmailAdapter {
  return (args) => {
    const real = factory(args)
    return {
      ...real,
      sendEmail: async (message: SendEmailOptions) => {
        if (!emailsAreBlocked()) return real.sendEmail(message)
        console.log(`[email blocked - BLOCK_EMAILS=true] to: ${asList(message.to) || '-'} | subject: ${message.subject}`)
        await saveBlockedCopy(message)
        return { id: 'blocked-by-setting' }
      },
    }
  }
}
