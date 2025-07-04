import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import Replicate from "replicate"

// 只允许POST请求
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 检查用量限制
    if (session.subscription_status === "free") {
      // 查询本月使用次数
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM 格式
      const usageCount = await sql`
        SELECT COUNT(*) as count 
        FROM usage_logs 
        WHERE user_id = ${session.id} 
        AND action = 'background_removal' 
        AND created_at >= ${currentMonth + '-01'}
      `
      
      const monthlyUsage = Number(usageCount[0]?.count || 0)
      
      if (monthlyUsage >= 3) {
        return NextResponse.json({ 
          error: "Free plan limit reached (3 images/month). Please upgrade to Premium for more." 
        }, { status: 403 })
      }
    }

    // Check if Replicate API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN not configured")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const image = formData.get("image") as File
    const format = formData.get("format") as string || "png"
    const reverse = formData.get("reverse") === "true"
    const threshold = parseFloat(formData.get("threshold") as string) || 0
    const backgroundType = formData.get("background_type") as string || "rgba"

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

    console.log("=== Background Removal API Debug ===")
    console.log("User:", { id: session.id, email: session.email, subscription: session.subscription_status })
    console.log("REPLICATE_API_TOKEN configured:", !!process.env.REPLICATE_API_TOKEN)
    
    // 按照官方文档初始化 Replicate (自动从环境变量读取REPLICATE_API_TOKEN)
    const replicate = new Replicate()

    // Convert image to base64 data URL
    const imageBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64Image}`

    console.log("Image info:", {
      type: image.type,
      size: image.size,
      base64Length: base64Image.length,
      dataUrlLength: dataUrl.length
    })

    console.log("Starting background removal with Replicate...")

    // 构建完整的输入参数
    const input = {
      image: dataUrl,
      format: format,
      reverse: reverse,
      threshold: threshold,
      background_type: backgroundType
    }
    
    console.log("Calling Replicate with input:", { 
      imageLength: dataUrl.length,
      format,
      reverse,
      threshold,
      backgroundType
    })
    
    // 创建预测并等待完成
    const prediction = await replicate.predictions.create({
      version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      input: input
    })

    console.log("Prediction created:", prediction.id)
    console.log("Prediction status:", prediction.status)

    // 等待预测完成
    let completedPrediction = prediction
    while (completedPrediction.status !== "succeeded" && completedPrediction.status !== "failed") {
      console.log("Waiting for prediction to complete... Status:", completedPrediction.status)
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
      completedPrediction = await replicate.predictions.get(prediction.id)
    }

    console.log("Prediction completed with status:", completedPrediction.status)
    
    if (completedPrediction.status === "failed") {
      console.error("Prediction failed:", completedPrediction.error)
      throw new Error(`Background removal failed: ${completedPrediction.error}`)
    }

    const output = completedPrediction.output
    console.log("Background removal completed, output type:", typeof output)
    console.log("Output (full):", JSON.stringify(output, null, 2))
    console.log("Output (simple):", output)

    // 记录使用日志 - 移到成功处理后
    await sql`
      INSERT INTO usage_logs (user_id, action)
      VALUES (${session.id}, 'background_removal')
    `

    // 根据官方文档，output应该是一个URI字符串
    if (typeof output !== 'string') {
      console.error("Expected string URI, got:", typeof output, output)
      throw new Error(`Expected string URI from API, got ${typeof output}`)
    }

    // 获取处理后的图片
    console.log("Fetching processed image from URI:", output)
    const response = await fetch(output)
    
    if (!response.ok) {
      console.error(`Failed to fetch processed image: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch processed image: ${response.statusText}`)
    }

    const processedBuffer = await response.arrayBuffer()
    console.log("Processed image size:", processedBuffer.byteLength)

    return new NextResponse(processedBuffer, {
      headers: {
        "Content-Type": `image/${format}`,
        "Content-Disposition": `attachment; filename="background-removed.${format}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("=== Background Removal Error ===")
    console.error("Error:", error)
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error)
    
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      // 具体错误处理
      if (error.message.includes("authentication") || error.message.includes("Unauthorized")) {
        return NextResponse.json({ 
          error: "AI service authentication failed. Please check REPLICATE_API_TOKEN configuration." 
        }, { status: 500 })
      }
      
      if (error.message.includes("402") || error.message.includes("Payment Required") || error.message.includes("Billing required")) {
        return NextResponse.json({ 
          error: "AI service requires billing setup. Please configure payment method at https://replicate.com/account/billing" 
        }, { status: 402 })
      }
      
      if (error.message.includes("rate limit")) {
        return NextResponse.json({ 
          error: "Service temporarily unavailable due to rate limiting. Please try again later." 
        }, { status: 429 })
      }
      
      if (error.message.includes("model") || error.message.includes("prediction")) {
        return NextResponse.json({ 
          error: "AI model error. Please try with a different image." 
        }, { status: 500 })
      }
      
      // 数据库错误
      if (error.message.includes("sql") || error.message.includes("database")) {
        return NextResponse.json({ 
          error: "Database error. Please try again later." 
        }, { status: 500 })
      }
      
      // 返回更详细的错误信息用于调试
      return NextResponse.json({ 
        error: "Failed to process image", 
        details: error.message,
        type: error.constructor.name 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: "Unknown error occurred", 
      details: String(error) 
    }, { status: 500 })
  }
}

// 处理其他HTTP方法，返回405错误
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
