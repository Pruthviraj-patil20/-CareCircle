"use client"

import { Calendar, CheckSquare, FileText, Heart, ShieldAlert, Users } from "lucide-react"

const features = [
  {
    title: "Task Synchronization",
    description: "Delegate chores, track completion, and never argue about who took out the trash again.",
    icon: CheckSquare,
  },
  {
    title: "Shared Family Calendar",
    description: "Sync school events, medical appointments, and family vacations seamlessly.",
    icon: Calendar,
  },
  {
    title: "Secure Document Vault",
    description: "Keep passports, insurance, and medical records encrypted and accessible only to trusted members.",
    icon: FileText,
  },
  {
    title: "Emergency Protocols",
    description: "Instant access to critical medical info, emergency contacts, and action plans.",
    icon: ShieldAlert,
  },
  {
    title: "Member Management",
    description: "Custom access levels for parents, kids, extended family, and caretakers.",
    icon: Users,
  },
  {
    title: "Wellness Tracking",
    description: "Keep a pulse on your family's health, mood, and overall well-being.",
    icon: Heart,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Everything you need to run your family.</h2>
          <p className="text-lg text-muted-foreground">
            CareCircle replaces a dozen disjointed apps with one elegant, unified platform designed specifically for the modern family.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
