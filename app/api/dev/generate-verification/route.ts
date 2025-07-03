import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  // 只在开发环境允许
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // 查找用户
    const users = await sql`
      SELECT id, is_verified FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    if (user.is_verified) {
      return NextResponse.json({ error: "User is already verified" }, { status: 400 })
    }

    // 生成新的验证令牌
    const verificationToken = randomBytes(32).toString("hex")

    // 更新用户的验证令牌
    await sql`
      UPDATE users 
      SET verification_token = ${verificationToken}
      WHERE email = ${email}
    `

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`

    return NextResponse.json({
      success: true,
      verificationUrl,
    })
  } catch (error) {
    console.error("Generate verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
