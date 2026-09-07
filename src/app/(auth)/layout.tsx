import Link from "next/link";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-background selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-tight">CareCircle</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Family Care Hub</span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/20">
          {children}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground z-10 border-t border-border/40 flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-end encrypted & permission-controlled family portal</span>
      </footer>
    </div>
  );
}

