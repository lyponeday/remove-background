import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // 查找用户
    const users = await sql`
      SELECT id, is_verified, created_at FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // 检查用户是否已经验证
    if (user.is_verified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // 检查用户创建时间，防止滥用（可选）
    const userCreatedAt = new Date(user.created_at)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60)

    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: "Verification link expired. Please create a new account." }, { status: 400 })
    }

    // 生成新的验证令牌
    const verificationToken = randomBytes(32).toString("hex")

    // 更新用户的验证令牌
    await sql`
      UPDATE users 
      SET verification_token = ${verificationToken}
      WHERE email = ${email}
    `

    console.log(`Resending verification email to ${email}`)

    // 发送验证邮件
    const emailResult = await sendVerificationEmail(email, verificationToken)

    console.log("Resend email result:", emailResult)

    // 构建响应
    const response: any = {
      success: true,
      emailSent: emailResult.success,
      emailMode: emailResult.mode,
      message: emailResult.success
        ? "Verification email sent successfully"
        : "Email sending failed, but verification link is available",
    }

    // 在开发环境或邮件发送失败时返回验证链接
    if (process.env.NODE_ENV === "development" || !emailResult.success) {
      response.verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`
    }

    if (!emailResult.success) {
      response.emailError = emailResult.error
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
