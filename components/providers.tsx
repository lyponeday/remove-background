"use client"

import { ThemeProvider } from "next-themes"
import { createContext, useContext, useState, type ReactNode } from "react"
import { type Locale, getTranslations } from "@/lib/i18n"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: ReturnType<typeof getTranslations>
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return context
}

interface LocaleProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function LocaleProvider({ children, initialLocale = "en" }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const t = getTranslations(locale)

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  )
}
