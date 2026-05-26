import { Hero } from '@/components/home/Hero'
import { Marquee } from '@/components/shared/Marquee'
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { JournalTeaser } from '@/components/home/JournalTeaser'
import { Newsletter } from '@/components/home/Newsletter'

export default function Homepage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Hero />
      <Marquee />
      <FeaturedProductsSection />
      <CategoriesSection />
      <AboutTeaser />
      <TrustBadges />
      <JournalTeaser />
      <Newsletter />
    </div>
  )
}
