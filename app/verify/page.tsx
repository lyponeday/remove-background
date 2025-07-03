import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams
  let success = false
  let error = ""

  if (token) {
    try {
      const users = await sql`
        UPDATE users 
        SET is_verified = true, verification_token = null 
        WHERE verification_token = ${token}
        RETURNING id
      `

      if (users.length > 0) {
        success = true
      } else {
        error = "Invalid or expired verification token"
      }
    } catch (err) {
      error = "Verification failed"
    }
  } else {
    error = "No verification token provided"
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{success ? "Email Verified!" : "Verification Failed"}</CardTitle>
          <CardDescription>
            {success ? "Your email has been successfully verified. You can now log in to your account." : error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
