import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ApplyForm } from './ApplyForm'
import { CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function AffiliateApplyPage() {
  const user = await getPayloadUser()
  
  if (!user) {
    redirect('/login?redirect=/affiliates/apply')
  }

  const payload = await getPayload({ config })

  // Check existing application
  const existingApp = await payload.find({
    collection: 'affiliate-applications',
    where: { user: { equals: user.id } },
    overrideAccess: true,
  })

  // Check if they are already an approved affiliate
  const existingAffiliate = await payload.find({
    collection: 'affiliates',
    where: { user: { equals: user.id } },
    overrideAccess: true,
  })

  if (existingAffiliate.docs.length > 0 && existingAffiliate.docs[0].status === 'approved') {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">You're Already an Affiliate!</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Your account is fully approved. Head over to your dashboard to get your links and start earning.
        </p>
        <Link 
          href="/affiliates/dashboard"
          className="rounded-md bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  if (existingApp.docs.length > 0) {
    const app = existingApp.docs[0]
    if (app.status === 'pending') {
      return (
        <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
          <Clock className="mb-4 h-16 w-16 text-yellow-500" />
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Application Pending</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            We've received your affiliate application and our team is currently reviewing it. 
            We'll notify you via email as soon as there's an update!
          </p>
          <Link 
            href="/account"
            className="rounded-md bg-gray-200 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Return to Account
          </Link>
        </div>
      )
    } else if (app.status === 'rejected') {
      return (
        <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Application Declined</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Unfortunately, your previous application was not accepted at this time.
          </p>
          <Link 
            href="/account"
            className="rounded-md bg-gray-200 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Return to Account
          </Link>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Join Our Affiliate Program</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Earn 10% commission on every sale you refer to us. Fill out the application below to get started.
        </p>
      </div>
      
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
        <ApplyForm />
      </div>
    </div>
  )
}
