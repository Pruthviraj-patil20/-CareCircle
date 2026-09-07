import Link from "next/link"
import { HeartHandshake } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { auth } from "@/lib/auth"

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="bg-primary/10 p-2 rounded-xl text-primary transition-transform duration-200 group-hover:scale-105">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">CareCircle</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground">How it Works</Link>
          <Link href="#security" className="transition-colors hover:text-foreground">Security</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard">
              <Button className="rounded-full px-6">Go to Dashboard</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="rounded-full px-6">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
