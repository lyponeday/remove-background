import { NextResponse } from "next/server"
import { testEmailConnection } from "@/lib/email"

export async function GET() {
  // 只在开发环境允许
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const result = await testEmailConnection()

    return NextResponse.json({
      ...result,
      resendApiKey: process.env.RESEND_API_KEY ? "Configured" : "Not configured",
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    })
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
