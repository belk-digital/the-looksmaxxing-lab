import type { CollectionConfig } from 'payload'
import { beforeChangeEmailLowercase, afterCreateUserTodo } from '@/hooks/users'
import { accessUsers } from '@/access/users'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200,
    forgotPassword: {
      generateEmailHTML: (args) => {
        const resetURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${args?.token}`
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
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
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}" class="logo">Longevia</a>
        </td>
      </tr>
      <tr>
        <td class="content-block">
          <div class="eyebrow">Security Notice</div>
          <h1>Password Reset</h1>
          <p>
            A request was made to reset the password for your Longevia Research account. Click the button below to securely update your credentials.
          </p>
          <a href="${resetURL}" class="btn">Reset Password</a>
          <p style="margin-top: 40px; font-size: 13px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="disclaimer">
            © ${new Date().getFullYear()} Longevia Research. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
      },
    },
  },
  access: accessUsers,
  fields: [
    // default fields added by Payload: email, password
    {
      name: 'firstName',
      type: 'text',
      required: false,
    },
    {
      name: 'lastName',
      type: 'text',
      required: false,
    },
    {
      name: 'clerkUserId',
      type: 'text',
      unique: true,
      index: true,
      access: { 
        read: () => false,
        update: () => false, // Prevent manual editing in admin UI
      },
    },
    {
      name: 'phone',
      type: 'text',
      validate: (val: string | null | undefined) => {
        if (!val) return true
        const regex = /^\+?[1-9]\d{1,14}$/
        return regex.test(val) || 'Phone must be in E.164 format'
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
        { label: 'Staff', value: 'staff' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },

    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'acceptsMarketing',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'preferredLocale',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' },
      ],
    },
    {
      name: 'dateOfBirth',
      type: 'date',
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        readOnly: true,
        condition: ({ user }) => !!user?.role && ['admin', 'staff'].includes(user.role),
      },
    },
    {
      name: 'defaultShippingAddress',
      type: 'relationship',
      relationTo: 'addresses',
      hasMany: false,
      filterOptions: ({ id }) => {
        if (id) {
          return {
            user: {
              equals: id,
            },
          }
        }
        return false // If the user hasn't been created yet, they can't have addresses
      },
    },
    {
      name: 'defaultBillingAddress',
      type: 'relationship',
      relationTo: 'addresses',
      hasMany: false,
      filterOptions: ({ id }) => {
        if (id) {
          return {
            user: {
              equals: id,
            },
          }
        }
        return false
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        readOnly: true,
        condition: ({ user }) => !!user?.role && ['admin', 'staff'].includes(user.role),
      },
    },
    {
      name: 'metadata',
      type: 'json',
    },
    {
      name: 'maxxPoints',
      type: 'number',
      defaultValue: 0,
      access: {
        update: ({ req }) => ['admin', 'staff'].includes(req.user?.role || ''),
      },
      admin: {
        description: 'Maxx Points ($1 per point). Can be used by users at checkout.',
      },
    },
  ],
  hooks: {
    beforeChange: [beforeChangeEmailLowercase],
    afterChange: [afterCreateUserTodo],
  },
}
