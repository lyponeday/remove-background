"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Mail, Database, CheckCircle, XCircle, RefreshCw, TestTube } from "lucide-react"

export default function DevToolsPage() {
  const [email, setEmail] = useState("")
  const [verificationUrl, setVerificationUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking")
  const [emailStatus, setEmailStatus] = useState<any>(null)

  const generateVerificationLink = async () => {
    if (!email) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/dev/generate-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl)
      }
    } catch (error) {
      console.error("Error generating verification link:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) return

    setIsResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl)
      }
      console.log("Resend result:", data)
    } catch (error) {
      console.error("Error resending verification email:", error)
    } finally {
      setIsResending(false)
    }
  }

  const testEmailConnection = async () => {
    setIsTestingEmail(true)
    try {
      const response = await fetch("/api/dev/test-email")
      const data = await response.json()
      setEmailStatus(data)
      console.log("Email test result:", data)
    } catch (error) {
      console.error("Error testing email:", error)
      setEmailStatus({ success: false, error: "Test failed" })
    } finally {
      setIsTestingEmail(false)
    }
  }

  const testDatabaseConnection = async () => {
    setDbStatus("checking")
    try {
      const response = await fetch("/api/dev/test-db")
      if (response.ok) {
        setDbStatus("connected")
      } else {
        setDbStatus("error")
      }
    } catch (error) {
      setDbStatus("error")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Development Tools
          </CardTitle>
          <CardDescription>Tools for testing and development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Database Connection Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Connection
            </h3>
            <div className="flex items-center gap-4">
              <Button onClick={testDatabaseConnection} disabled={dbStatus === "checking"}>
                {dbStatus === "checking" ? "Testing..." : "Test Connection"}
              </Button>
              {dbStatus === "connected" && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Neon Database Connected</span>
                </div>
              )}
              {dbStatus === "error" && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Connection Failed</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Service Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Email Service Test
            </h3>
            <div className="flex items-center gap-4">
              <Button onClick={testEmailConnection} disabled={isTestingEmail}>
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingEmail ? "Testing..." : "Test Email Service"}
              </Button>
            </div>

            {emailStatus && (
              <Alert variant={emailStatus.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>Status:</strong> {emailStatus.success ? "✅ Working" : "❌ Failed"}
                    </p>
                    <p>
                      <strong>Resend API Key:</strong> {emailStatus.resendApiKey}
                    </p>
                    <p>
                      <strong>App URL:</strong> {emailStatus.appUrl}
                    </p>
                    {emailStatus.error && (
                      <p>
                        <strong>Error:</strong> {emailStatus.error}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Email Verification Tool */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Verification
            </h3>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to generate verification link"
                />
                <Button onClick={generateVerificationLink} disabled={isLoading || !email}>
                  {isLoading ? "Generating..." : "Generate Link"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resendVerificationEmail}
                  disabled={isResending || !email}
                  className="flex-1 bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? "animate-spin" : ""}`} />
                  {isResending ? "Resending..." : "Resend Email"}
                </Button>
              </div>
            </div>

            {verificationUrl && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Verification Link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{verificationUrl}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(verificationUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button asChild className="w-full">
                      <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                        Open Verification Link
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid gap-2">
              <Button variant="outline" asChild>
                <a href="/signup">Test Signup Flow</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/login">Test Login Flow</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/remove-bg">Test Tool (requires login)</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/pricing">Test Pricing Page</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
