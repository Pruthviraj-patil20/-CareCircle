import { HeroSection } from "@/components/sections/HeroSection"
import { ProductPreviewSection } from "@/components/sections/ProductPreviewSection"
import { FeaturesSection } from "@/components/sections/FeaturesSection"
import { HowItWorksSection } from "@/components/sections/HowItWorksSection"
import { SecuritySection } from "@/components/sections/SecuritySection"
import { CTASection } from "@/components/sections/CTASection"

export default function MarketingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProductPreviewSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <CTASection />
    </div>
  )
}
