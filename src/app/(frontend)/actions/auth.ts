'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function registerUser(data: FormData) {
  const email = data.get('email') as string
  const password = data.get('password') as string
  const confirmPassword = data.get('confirmPassword') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  try {
    const payload = await getPayload({ config })
    
    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
    })

    if (existing.totalDocs > 0) {
      return { error: 'User with this email already exists' }
    }

    // Create user
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: 'customer',
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { error: error.message || 'Failed to register account' }
  }
}
