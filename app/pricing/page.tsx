import { PricingModal } from "@/components/pricing-modal"
import { getSession } from "@/lib/auth"

export default async function PricingPage() {
  const session = await getSession()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <PricingModal user={session} />
      </div>
    </div>
  )
}
