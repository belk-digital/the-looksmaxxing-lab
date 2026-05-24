import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-4xl font-extrabold tracking-tight">404</h2>
      <p className="mb-8 text-lg text-gray-400">This page could not be found.</p>
      <Link 
        href="/"
        className="rounded-full bg-indigo-500 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-600 hover:scale-105"
      >
        Return Home
      </Link>
    </div>
  )
}
