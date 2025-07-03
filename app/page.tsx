"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Sparkles, MousePointer } from "lucide-react"
import { useLocale } from "@/components/providers"
import Link from "next/link"

export default function HomePage() {
  const { t } = useLocale()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {t.home.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t.home.subtitle}</p>
        <Button size="lg" asChild>
          <Link href="/remove-bg">{t.home.cta}</Link>
        </Button>
      </section>

      {/* Tool Preview */}
      <section className="mb-16">
        <div className="bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Live Tool Preview</h2>
          <div className="aspect-video bg-background rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden">
            <iframe src="/remove-bg" className="w-full h-full" title="Background Remover Tool" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">{t.home.features.title}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>{t.home.features.fast}</CardTitle>
              <CardDescription>{t.home.features.fastDesc}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <CardTitle>{t.home.features.quality}</CardTitle>
              <CardDescription>{t.home.features.qualityDesc}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MousePointer className="h-12 w-12 text-primary mb-4" />
              <CardTitle>{t.home.features.easy}</CardTitle>
              <CardDescription>{t.home.features.easyDesc}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  )
}
