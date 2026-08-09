import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function unlockUser() {
  const payload = await getPayload({ config: configPromise })
  
  const users = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: 'main.belkdigital@gmail.com',
      },
    },
  })

  if (users.docs.length > 0) {
    const user = users.docs[0]
    console.log(`Found user: ${user.email}. Unlocking...`)
    
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        loginAttempts: 0,
        lockUntil: null,
      },
    })
    console.log('User unlocked successfully! You can now log in.')
  } else {
    console.log('User not found.')
  }
}

unlockUser().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})
