import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  // 只在开发环境允许
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    // 测试数据库连接
    const result = await sql`SELECT 1 as test`

    // 检查表是否存在
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'usage_logs')
    `

    return NextResponse.json({
      success: true,
      connection: "OK",
      tables: tables.map((t) => t.table_name),
      message: "Neon database connected successfully",
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
