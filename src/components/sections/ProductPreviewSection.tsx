"use client"

import { motion } from "framer-motion"

export function ProductPreviewSection() {
  return (
    <section className="py-12 bg-background relative z-10">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-5xl rounded-2xl border border-border/50 bg-background/50 p-2 shadow-2xl backdrop-blur-sm lg:p-4"
        >
          <div className="overflow-hidden rounded-xl border border-border bg-muted/20 shadow-inner">
            <div className="aspect-video w-full bg-gradient-to-br from-muted/50 to-background flex items-center justify-center relative">
              {/* This is a placeholder for the actual app screenshot/video */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay dark:opacity-10"></div>
              <div className="text-center space-y-4 relative z-10 p-6 bg-background/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-xl">
                <div className="flex gap-2 justify-center mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <h3 className="text-2xl font-bold">Interactive Dashboard</h3>
                <p className="text-muted-foreground">Everything your family needs, at a glance.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
