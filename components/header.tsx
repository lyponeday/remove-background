"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, Languages, User, LogOut, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useLocale } from "./providers"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { DevNav } from "./dev-nav"

interface HeaderProps {
  user?: {
    id: number
    email: string
    name?: string
    subscription_status: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLocale()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.reload()
  }

  if (!mounted) return null

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          AI BG Remover
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            {t.nav.home}
          </Link>
          <Link href="/remove-bg" className="text-sm font-medium hover:text-primary transition-colors">
            {t.nav.tool}
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            {t.nav.pricing}
          </Link>
          <DevNav />
        </nav>

        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLocale("en")}>English {locale === "en" && "✓"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("zh")}>中文 {locale === "zh" && "✓"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{user.name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name || user.email}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user.subscription_status} Plan</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/pricing">
                    <Settings className="h-4 w-4 mr-2" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t.nav.login}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t.nav.signup}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
