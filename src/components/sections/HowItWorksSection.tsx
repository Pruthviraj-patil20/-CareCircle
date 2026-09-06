export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Seamless Setup</h2>
          <p className="text-lg text-muted-foreground">
            Get your family onboarded and organized in minutes, not hours.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-border -z-10"></div>
          
          <div className="text-center relative bg-background">
            <div className="mx-auto h-24 w-24 rounded-full border-4 border-background bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-6 shadow-xl">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Create your Circle</h3>
            <p className="text-muted-foreground">Set up your family profile and establish the foundation of your digital home.</p>
          </div>
          
          <div className="text-center relative bg-background">
            <div className="mx-auto h-24 w-24 rounded-full border-4 border-background bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-6 shadow-xl">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Invite Members</h3>
            <p className="text-muted-foreground">Add your partner, kids, and caretakers with custom permission levels.</p>
          </div>
          
          <div className="text-center relative bg-background">
            <div className="mx-auto h-24 w-24 rounded-full border-4 border-background bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-6 shadow-xl">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Restore Harmony</h3>
            <p className="text-muted-foreground">Start delegating, planning, and enjoying a more organized family life.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
