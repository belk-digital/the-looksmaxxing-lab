import { NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// This secret ensures only Vercel (or authorized services) can run the cron
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })
    
    // Calculate timestamp for 1 hour ago
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)

    // Find carts that were updated over 1 hour ago, and haven't had an email sent
    const { docs: carts } = await payload.find({
      collection: 'carts',
      where: {
        updatedAt: {
          less_than: oneHourAgo.toISOString()
        },
        abandonedEmailSentAt: {
          exists: false
        }
      },
      depth: 1 // Fetch user details so we have the email
    })

    let sentCount = 0

    for (const cart of carts) {
      // Check if cart actually has items
      if (cart.items && cart.items.length > 0) {
        const user = cart.user as any
        
        if (user && user.email) {
          // Send the abandoned cart email
          // You can put your custom HTML design here
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'research@thelooksmaxxinglab.com',
            to: user.email,
            subject: 'Did you leave research materials behind?',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Cart is Waiting</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    body { margin: 0; padding: 0; background-color: #050505; color: #EAE7DE; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #111111; border-left: 1px solid #1a1a1a; border-right: 1px solid #1a1a1a; }
    .header { padding: 40px 20px; text-align: center; }
    .logo { font-family: Georgia, serif; font-size: 32px; font-weight: bold; letter-spacing: -2px; color: #ffffff; text-decoration: none; }
    .content-block { padding: 40px 40px 50px 40px; text-align: center; }
    .eyebrow { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #888888; margin-bottom: 20px; }
    h1 { font-size: 34px; font-weight: 700; letter-spacing: -1px; text-transform: uppercase; margin: 0 0 20px 0; color: #ffffff; line-height: 1.1; }
    p { font-size: 15px; line-height: 1.6; color: #a3a3a3; margin: 0 0 35px 0; font-weight: 300; }
    .btn { display: inline-block; background-color: #ffffff; color: #000000 !important; padding: 18px 45px; border-radius: 2px; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .footer { padding: 40px; text-align: center; background-color: #050505; border-top: 1px solid #1a1a1a; }
    .disclaimer { font-size: 10px; line-height: 1.6; color: #444444; font-weight: 300; }
  </style>
</head>
<body>
  <center style="width: 100%; background-color: #050505;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container">
      <tr>
        <td class="header">
          <a href="https://thelooksmaxxinglab.com" class="logo">TLML</a>
        </td>
      </tr>
      <tr>
        <td class="content-block">
          <div class="eyebrow">Inventory Notice</div>
          <h1>Your Research Is Waiting</h1>
          <p>
            We noticed you left high-grade compounds in your cart. Due to extremely high demand across our research network, we can only reserve this inventory for a limited time before releasing it to the public.
          </p>
          <p>
            Return to the lab to secure your synthesis.
          </p>
          <a href="https://thelooksmaxxinglab.com/cart" class="btn">Return to Cart</a>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="disclaimer">
            <strong>FDA Disclaimer:</strong> These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease. All products offered are for laboratory and research use only. They are not intended for human consumption.<br><br>
            © 2026 The Looksmaxxing Lab. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
          })

          // Mark this cart as emailed so they don't get spammed again
          await payload.update({
            collection: 'carts',
            id: cart.id,
            data: {
              abandonedEmailSentAt: new Date().toISOString()
            }
          })

          sentCount++
        }
      }
    }

    return NextResponse.json({ success: true, message: `Processed abandoned carts. Sent ${sentCount} emails.` })
  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
