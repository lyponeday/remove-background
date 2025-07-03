import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL, {
  // 禁用浏览器警告（仅在服务器端使用）
  disableWarningInBrowsers: true,
})

export interface User {
  id: number
  email: string
  password_hash?: string
  name?: string
  is_verified: boolean
  verification_token?: string
  subscription_status: "free" | "premium" | "pro"
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: number
  user_id: number
  session_token: string
  expires_at: Date
  created_at: Date
}
