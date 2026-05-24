import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function runTest() {
  const payload = await getPayload({ config: configPromise })

  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `test_${Date.now()}@test.com`,
        clerkUserId: `user_${Date.now()}`,
        password: 'testpassword123',
        role: 'customer'
      } as any,
      overrideAccess: true,
    })
    
    console.log('Successfully created user:', user.id)
    process.exit(0)
  } catch (err: any) {
    console.error('Failed to create user:')
    console.error(err)
    process.exit(1)
  }
}

runTest()
