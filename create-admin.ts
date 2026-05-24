import { getPayload } from 'payload'
import config from './src/payload.config'
import 'dotenv/config'

async function run() {
  const payload = await getPayload({ config })
  
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: 'admin@test.com' } },
  })
  
  if (existing.docs.length > 0) {
    console.log('Admin user already exists.')
    // Let's reset their password just in case
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: {
        password: 'password123',
        role: 'admin',
      }
    })
    console.log('Password reset to password123')
  } else {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      }
    })
    console.log('Admin user created with email admin@test.com and password password123')
  }
  process.exit(0)
}

run().catch(console.error)
