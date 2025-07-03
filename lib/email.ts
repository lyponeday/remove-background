import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not found, email functionality will be disabled")
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`

  // 如果没有配置 Resend，只在控制台显示信息
  if (!resend) {
    console.log("=== EMAIL SIMULATION (No RESEND_API_KEY) ===")
    console.log(`To: ${email}`)
    console.log(`Subject: Verify your email address`)
    console.log(`Verification URL: ${verificationUrl}`)
    console.log("===========================================")
    return { success: true, mode: "simulation" }
  }

  try {
    console.log("Attempting to send email via Resend...")
    console.log(`To: ${email}`)
    console.log(`Verification URL: ${verificationUrl}`)

    const result = await resend.emails.send({
      from: "AI Background Remover <onboarding@resend.dev>", // 使用 Resend 的测试域名
      to: [email],
      subject: "Verify your email address - AI Background Remover",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email address</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">AI Background Remover</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Welcome to our platform!</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify your email address</h2>
            <p>Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 14px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't create an account with us, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
              This verification link will expire in 24 hours.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        AI Background Remover - Verify your email address
        
        Thank you for signing up! Please visit the following link to verify your email address:
        
        ${verificationUrl}
        
        If you didn't create an account with us, you can safely ignore this email.
        This verification link will expire in 24 hours.
      `,
    })

    console.log("Email sent successfully:", result)
    return { success: true, result, mode: "sent" }
  } catch (error) {
    console.error("Failed to send verification email:", error)

    // 详细错误日志
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // 不抛出错误，返回失败状态但允许注册继续
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      mode: "failed",
      fallbackUrl: verificationUrl,
    }
  }
}

// 测试邮件发送功能
export async function testEmailConnection() {
  if (!resend) {
    return { success: false, error: "RESEND_API_KEY not configured" }
  }

  try {
    // 发送测试邮件到一个测试地址
    const result = await resend.emails.send({
      from: "AI Background Remover <onboarding@resend.dev>",
      to: ["test@example.com"], // 这会失败，但能测试API连接
      subject: "Test Email Connection",
      html: "<p>This is a test email.</p>",
    })

    return { success: true, result }
  } catch (error) {
    console.error("Email connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
