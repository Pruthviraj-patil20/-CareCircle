import { Lock, ShieldCheck, Key } from "lucide-react"

export function SecuritySection() {
  return (
    <section id="security" className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">Your family's data, fortress secured.</h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              We understand that you are trusting us with your most precious asset. That's why we've built CareCircle with bank-level encryption and privacy by design.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-1">End-to-End Encryption</h4>
                  <p className="text-primary-foreground/70">Your sensitive documents and data are encrypted before they ever leave your device.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-1">Zero-Knowledge Architecture</h4>
                  <p className="text-primary-foreground/70">We cannot read your documents or see your passwords. Only you hold the keys.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-1">Granular Permissions</h4>
                  <p className="text-primary-foreground/70">Control exactly what each family member or caretaker can see and do.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden border border-primary-foreground/20 bg-background/5">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563207153-f404be25e7bc?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border-4 border-primary-foreground/30 flex items-center justify-center backdrop-blur-md">
                   <ShieldCheck className="h-16 w-16 text-primary-foreground" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
