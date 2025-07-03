"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { useLocale } from "./providers"
import { PRICING_PLANS } from "@/lib/stripe"

interface PricingModalProps {
  user?: {
    subscription_status: string
  } | null
}

export function PricingModal({ user }: PricingModalProps) {
  const { t } = useLocale()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    setIsLoading(planId)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{t.pricing.title}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t.pricing.title}</DialogTitle>
          <DialogDescription>Choose the plan that works best for you</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Free Plan */}
          <Card className={user?.subscription_status === "free" ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle>{t.pricing.free}</CardTitle>
              <CardDescription>{t.pricing.freeDesc}</CardDescription>
              <div className="text-2xl font-bold">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />3 images per month
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Basic quality
                </li>
              </ul>
              {user?.subscription_status === "free" && (
                <Button disabled className="w-full">
                  {t.pricing.currentPlan}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={user?.subscription_status === "premium" ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle>{t.pricing.premium}</CardTitle>
              <CardDescription>{t.pricing.premiumDesc}</CardDescription>
              <div className="text-2xl font-bold">${PRICING_PLANS.premium.price}</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {PRICING_PLANS.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {user?.subscription_status === "premium" ? (
                <Button disabled className="w-full">
                  {t.pricing.currentPlan}
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubscribe("premium")}
                  disabled={isLoading === "premium"}
                  className="w-full"
                >
                  {isLoading === "premium" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t.pricing.subscribe}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={user?.subscription_status === "pro" ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle>{t.pricing.pro}</CardTitle>
              <CardDescription>{t.pricing.proDesc}</CardDescription>
              <div className="text-2xl font-bold">${PRICING_PLANS.pro.price}</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {PRICING_PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {user?.subscription_status === "pro" ? (
                <Button disabled className="w-full">
                  {t.pricing.currentPlan}
                </Button>
              ) : (
                <Button onClick={() => handleSubscribe("pro")} disabled={isLoading === "pro"} className="w-full">
                  {isLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t.pricing.subscribe}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
