"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-6 flex items-center justify-center space-x-2 text-primary font-medium">
            <ShieldCheck className="h-5 w-5" />
            <span>The #1 Family Responsibility Coordinator</span>
          </div>
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Harmony in every <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">family moment.</span>
          </h1>
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            Streamline tasks, synchronize schedules, and secure your family's vital information in one premium, elegant platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full w-full sm:w-auto text-lg px-8 h-14">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto text-lg px-8 h-14">
                See How It Works
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
