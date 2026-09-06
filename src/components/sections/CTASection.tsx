import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Ready to bring harmony to your home?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of families who have upgraded their daily lives with CareCircle. Free 14-day trial on all premium features.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full px-10 h-16 text-lg">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required for setup.</p>
        </div>
      </div>
    </section>
  )
}
