"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Filter known false-positive React 19 / next-themes script tag warning in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    const message = args.map((a) => (typeof a === "string" ? a : "")).join(" ")
    if (message.includes("Encountered a script tag while rendering React component")) {
      return
    }
    originalError.apply(console, args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

