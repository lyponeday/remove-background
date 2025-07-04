import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ 
        error: "Not logged in",
        isLoggedIn: false 
      }, { status: 401 })
    }

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
    
    // 根据订阅状态计算剩余次数
    let maxUsage = 0
    let remainingUsage = 0
    
    switch (session.subscription_status) {
      case "free":
        maxUsage = 3
        remainingUsage = Math.max(0, maxUsage - monthlyUsage)
        break
      case "premium":
        maxUsage = 100
        remainingUsage = Math.max(0, maxUsage - monthlyUsage)
        break
      case "pro":
        maxUsage = -1 // 无限制
        remainingUsage = -1
        break
      default:
        maxUsage = 0
        remainingUsage = 0
    }

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        subscription_status: session.subscription_status,
        is_verified: session.is_verified
      },
      usage: {
        current_month: monthlyUsage,
        max_usage: maxUsage,
        remaining: remainingUsage,
        month: currentMonth
      }
    })
  } catch (error) {
    console.error("User status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 