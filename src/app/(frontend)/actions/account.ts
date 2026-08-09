'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function updatePassword(data: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return { error: 'Not authenticated' }
    }

    const currentPassword = data.get('currentPassword') as string
    const newPassword = data.get('newPassword') as string

    const payload = await getPayload({ config: configPromise })
    
    // Login to verify current password
    try {
      await payload.login({
        collection: 'users',
        data: {
          email: session.user.email,
          password: currentPassword,
        },
      })
    } catch (e) {
      return { error: 'Incorrect current password' }
    }

    const userDocs = await payload.find({
      collection: 'users',
      where: { email: { equals: session.user.email } },
    })

    if (userDocs.docs.length === 0) return { error: 'User not found' }

    await payload.update({
      collection: 'users',
      id: userDocs.docs[0].id,
      data: {
        password: newPassword,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update password:', error)
    return { error: 'Internal server error' }
  }
}
