import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import Replicate from "replicate"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.subscription_status === "free") {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 })
    }

    // Check if Replicate API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN not configured")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Log usage
    await sql`
      INSERT INTO usage_logs (user_id, action)
      VALUES (${session.id}, 'background_removal')
    `

    // Initialize Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    // Convert image to base64 data URL
    const imageBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64Image}`

    console.log("Starting background removal with Replicate...")

    // Run the background removal model
    const output = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      {
        input: {
          image: dataUrl,
          format: "png",
          background_type: "rgba" // Transparent background
        }
      }
    )

    console.log("Background removal completed, output:", output)

    // Fetch the processed image from Replicate
    const response = await fetch(output as string)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch processed image: ${response.statusText}`)
    }

    const processedBuffer = await response.arrayBuffer()

    return new NextResponse(processedBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="background-removed.png"',
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Background removal error:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        return NextResponse.json({ error: "AI service authentication failed" }, { status: 500 })
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 429 })
      }
    }
    
    return NextResponse.json({ error: "Failed to process image. Please try again." }, { status: 500 })
  }
}
