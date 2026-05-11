import Navbar from '@/components/navbar'
import HeroSection from '@/components/hero-section'
import CategoriesSection from '@/components/categories-section'
import HowItWorks from '@/components/how-it-works'
import MarqueeTicker from '@/components/marquee-ticker'
import FeaturedListings from '@/components/featured-listings'
import Footer from '@/components/footer'
import ScrollToTop from '@/components/scroll-to-top'
import CtaBanner from '@/components/cta-banner'

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <CategoriesSection />
      <MarqueeTicker />
      <FeaturedListings />
      <CtaBanner />
      <Footer />
      <ScrollToTop />
    </main>
  )
}
