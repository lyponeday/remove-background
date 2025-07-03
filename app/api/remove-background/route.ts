import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.subscription_status === "free") {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 })
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

    // Mock AI processing - replace with actual AI service
    // For Replicate integration, uncomment and configure:
    /*
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    const imageBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64Image}`

    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: dataUrl
        }
      }
    )

    // Fetch the processed image
    const response = await fetch(output as string)
    const processedBuffer = await response.arrayBuffer()

    return new NextResponse(processedBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="background-removed.png"',
      },
    })
    */

    // For now, return a mock processed image (original image with some processing indicator)
    const buffer = await image.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="background-removed.png"',
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Background removal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
