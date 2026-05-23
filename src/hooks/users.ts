// src/hooks/users.ts
import type { BeforeChangeHook, AfterChangeHook } from 'payload/types'

/**
 * Lower‑case the email on create / update.
 */
export const beforeChangeEmailLowercase: BeforeChangeHook = async ({ data, originalDoc }) => {
  if (data.email) {
    data.email = (data.email as string).toLowerCase()
  }
  // Preserve existing email on updates if not changed
  if (!data.email && originalDoc?.email) {
    data.email = (originalDoc.email as string).toLowerCase()
  }
  return data
}

/**
 * Placeholder hook after a new user is created.
 * TODO: create Stripe customer + send welcome email.
 */
export const afterCreateUserTodo: AfterChangeHook = async ({ doc, operation }) => {
  if (operation === 'create') {
    console.log(
      `[TODO] After user creation – add Stripe customer & welcome email for user ${doc.id}`,
    )
  }
}
