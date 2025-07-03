"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Mail, Database, CheckCircle, XCircle, RefreshCw, TestTube, Zap, Key } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

interface TestResult {
  status: "idle" | "loading" | "success" | "error"
  message?: string
  data?: any
}

export default function DevToolsPage() {
  const [email, setEmail] = useState("")
  const [verificationUrl, setVerificationUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking")
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [dbTest, setDbTest] = useState<TestResult>({ status: "idle" })
  const [emailTest, setEmailTest] = useState<TestResult>({ status: "idle" })
  const [replicateTest, setReplicateTest] = useState<TestResult>({ status: "idle" })
  const [verificationGenerate, setVerificationGenerate] = useState<TestResult>({ status: "idle" })

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

  const testDatabase = async () => {
    setDbTest({ status: "loading" })
    try {
      const response = await fetch("/api/dev/test-db")
      const data = await response.json()
      setDbTest({
        status: response.ok ? "success" : "error",
        message: data.message || data.error,
        data,
      })
    } catch (error) {
      setDbTest({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const testEmail = async () => {
    setEmailTest({ status: "loading" })
    try {
      const response = await fetch("/api/dev/test-email", { method: "POST" })
      const data = await response.json()
      setEmailTest({
        status: response.ok ? "success" : "error",
        message: data.message || data.error,
        data,
      })
    } catch (error) {
      setEmailTest({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const testReplicate = async () => {
    setReplicateTest({ status: "loading" })
    try {
      // Test Replicate API by checking if token is configured
      const response = await fetch("/api/dev/check", { method: "POST" })
      const data = await response.json()
      
      setReplicateTest({
        status: data.replicate?.configured ? "success" : "error",
        message: data.replicate?.configured 
          ? "Replicate API token is configured" 
          : "Replicate API token not configured",
        data: data.replicate,
      })
    } catch (error) {
      setReplicateTest({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const generateVerification = async () => {
    setVerificationGenerate({ status: "loading" })
    try {
      const response = await fetch("/api/dev/generate-verification", { method: "POST" })
      const data = await response.json()
      setVerificationGenerate({
        status: response.ok ? "success" : "error",
        message: data.message || data.error,
        data,
      })
    } catch (error) {
      setVerificationGenerate({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const StatusIcon = ({ status }: { status: TestResult["status"] }) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "loading":
        return <Badge variant="secondary">Testing...</Badge>
      default:
        return <Badge variant="outline">Not tested</Badge>
    }
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
              <Button onClick={testDatabase} disabled={dbTest.status === "loading"}>
                <StatusIcon status={dbTest.status} />
                {dbTest.status === "loading" ? "Testing..." : "Test Connection"}
              </Button>
              {dbTest.status === "connected" && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Neon Database Connected</span>
                </div>
              )}
              {dbTest.status === "error" && (
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
              <Button onClick={testEmail} disabled={emailTest.status === "loading"}>
                <StatusIcon status={emailTest.status} />
                {emailTest.status === "loading" ? "Testing..." : "Test Email Service"}
              </Button>
            </div>

            {emailTest.message && (
              <Alert variant={emailTest.status === "error" ? "destructive" : "default"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>Status:</strong> {emailTest.status === "error" ? "❌ Failed" : "✅ Working"}
                    </p>
                    <p>
                      <strong>Resend API Key:</strong> {emailTest.data?.resendApiKey}
                    </p>
                    <p>
                      <strong>App URL:</strong> {emailTest.data?.appUrl}
                    </p>
                    {emailTest.message && (
                      <p>
                        <strong>Error:</strong> {emailTest.message}
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
                <Button onClick={generateVerification} disabled={isLoading || !email}>
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

          {/* Replicate Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Replicate API
            </h3>
            <div className="flex items-center gap-4">
              <Button onClick={testReplicate} disabled={replicateTest.status === "loading"}>
                <StatusIcon status={replicateTest.status} />
                {replicateTest.status === "loading" ? "Testing..." : "Test Replicate"}
              </Button>
            </div>

            {replicateTest.message && (
              <Alert variant={replicateTest.status === "error" ? "destructive" : "default"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>Status:</strong> {replicateTest.status === "error" ? "❌ Failed" : "✅ Working"}
                    </p>
                    <p>
                      <strong>Message:</strong> {replicateTest.message}
                    </p>
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

      <Separator className="my-8" />

      {/* Environment Variables Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Required environment variables for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>DATABASE_URL:</span>
              <Badge variant={process.env.DATABASE_URL ? "default" : "destructive"}>
                {process.env.DATABASE_URL ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>REPLICATE_API_TOKEN:</span>
              <Badge variant={process.env.REPLICATE_API_TOKEN ? "default" : "destructive"}>
                {process.env.REPLICATE_API_TOKEN ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>RESEND_API_KEY:</span>
              <Badge variant={process.env.RESEND_API_KEY ? "default" : "secondary"}>
                {process.env.RESEND_API_KEY ? "Set" : "Missing (Optional)"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>STRIPE_SECRET_KEY:</span>
              <Badge variant={process.env.STRIPE_SECRET_KEY ? "default" : "secondary"}>
                {process.env.STRIPE_SECRET_KEY ? "Set" : "Missing (Optional)"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
