import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
})

export const PRICING_PLANS = {
  premium: {
    name: "Premium",
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: ["Remove backgrounds from 100 images/month", "High quality processing", "Priority support"],
  },
  pro: {
    name: "Pro",
    price: 19.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ["Unlimited background removal", "Batch processing", "API access", "Priority support"],
  },
}
