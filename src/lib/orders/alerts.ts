import { getPayload } from 'payload'
import configPromise from '@payload-config'

/** Best-effort email to support for payment problems a human must reconcile. Never throws. */
export async function alertAdmin(subject: string, lines: Record<string, string | number | null | undefined>) {
  try {
    const payload = await getPayload({ config: configPromise })
    const items = Object.entries(lines)
      .map(([k, v]) => `<li><strong>${k}:</strong> ${String(v ?? 'N/A')}</li>`)
      .join('')
    await payload.sendEmail({
      to: 'support@longeviaresearch.com',
      subject,
      html: `<h2>${subject}</h2><ul>${items}</ul>`,
    })
  } catch (err) {
    console.error('Failed to send admin alert:', subject, err)
  }
}
