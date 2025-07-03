"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/components/providers"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Copy, Mail, Clock, AlertTriangle } from "lucide-react"

export default function SignupPage() {
  const { t } = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [verificationUrl, setVerificationUrl] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [emailStatus, setEmailStatus] = useState<{
    sent: boolean
    mode: string
    error?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const name = formData.get("name") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Signup response:", data)

        setSuccess(true)
        setUserEmail(email)
        setEmailStatus({
          sent: data.emailSent,
          mode: data.emailMode,
          error: data.emailError,
        })

        if (data.verificationUrl) {
          setVerificationUrl(data.verificationUrl)
        }
      } else {
        const data = await response.json()
        setError(data.error || "Signup failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !userEmail) return

    setIsResending(true)
    setError("")

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      })

      const data = await response.json()
      console.log("Resend response:", data)

      if (response.ok) {
        setEmailStatus({
          sent: data.emailSent,
          mode: data.emailMode,
          error: data.emailError,
        })

        if (data.verificationUrl) {
          setVerificationUrl(data.verificationUrl)
        }

        // 设置60秒冷却时间
        setResendCooldown(60)
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      setError("An error occurred while resending email")
    } finally {
      setIsResending(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Account Created Successfully!
            </CardTitle>
            <CardDescription>
              We've created your account for <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Status */}
            {emailStatus && (
              <Alert variant={emailStatus.sent ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    {emailStatus.sent ? (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-green-500" />
                        <span>Verification email sent successfully!</span>
                      </p>
                    ) : (
                      <div>
                        <p className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span>Email sending failed, but your account was created.</span>
                        </p>
                        {emailStatus.error && (
                          <p className="text-sm text-muted-foreground mt-1">Error: {emailStatus.error}</p>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">Mode: {emailStatus.mode}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Resend Email Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Need to resend the email?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendEmail}
                  disabled={isResending || resendCooldown > 0}
                >
                  {isResending ? (
                    <>
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Email
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Development Mode Verification Link */}
            {verificationUrl && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{emailStatus?.sent ? "Backup" : "Manual"} Verification Link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{verificationUrl}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(verificationUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button asChild className="w-full">
                      <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                        Verify Email Now
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Please check your email and click the verification link to activate your account.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>

            {/* Back to Login */}
            <div className="pt-4 border-t">
              <Button variant="ghost" asChild className="w-full">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t.auth.signup}</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t.auth.name}</Label>
              <Input id="name" name="name" type="text" required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" name="email" type="email" required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={isLoading} />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : t.auth.signup}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t.auth.login}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
