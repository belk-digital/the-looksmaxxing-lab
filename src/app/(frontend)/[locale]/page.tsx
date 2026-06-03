import { HomePreloaderWrapper } from '@/components/home/HomePreloaderWrapper'
import { Hero } from '@/components/home/Hero'
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { JournalTeaser } from '@/components/home/JournalTeaser'
import { CoaSection } from '@/components/home/CoaSection'
import { FaqSection } from '@/components/home/FaqSection'
import { WhatSetsUsApart } from '@/components/home/WhatSetsUsApart'

export default function Homepage() {
  return (
    <HomePreloaderWrapper>
      <div className="flex flex-col w-full min-h-screen relative z-10 bg-white">
        <Hero />
        <FeaturedProductsSection />
        <CategoriesSection />
        <AboutTeaser />
        <TrustBadges />
        <WhatSetsUsApart />
        <CoaSection />
        <JournalTeaser />
        <FaqSection />
      </div>
    </HomePreloaderWrapper>
  )
}

