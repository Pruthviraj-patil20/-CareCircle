import Link from "next/link"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">CareCircle</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground">How it Works</Link>
          <Link href="#security" className="transition-colors hover:text-foreground">Security</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link href="/dashboard">
            <Button className="rounded-full px-6">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
