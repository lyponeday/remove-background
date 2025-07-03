import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and create verification token
    const passwordHash = await hashPassword(password)
    const verificationToken = randomBytes(32).toString("hex")

    // Create user
    const newUsers = await sql`
      INSERT INTO users (email, password_hash, name, verification_token)
      VALUES (${email}, ${passwordHash}, ${name}, ${verificationToken})
      RETURNING id
    `

    const userId = newUsers[0].id

    console.log(`Created user ${userId} with email ${email}`)

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken)

    console.log("Email send result:", emailResult)

    // 构建响应
    const response: any = {
      success: true,
      userId,
      emailSent: emailResult.success,
      emailMode: emailResult.mode,
    }

    // 在开发环境或邮件发送失败时返回验证链接
    if (process.env.NODE_ENV === "development" || !emailResult.success) {
      response.verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`
    }

    // 如果邮件发送失败，添加错误信息但不阻止注册
    if (!emailResult.success) {
      response.emailError = emailResult.error
      response.message =
        "Account created successfully, but email sending failed. Please use the verification link below."
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
