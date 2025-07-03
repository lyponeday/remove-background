import { cookies } from "next/headers"
import { sql } from "./db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

export async function createSession(userId: number) {
  const sessionToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  // Clean up old sessions for this user
  await sql`
    DELETE FROM sessions 
    WHERE user_id = ${userId} AND expires_at < NOW()
  `

  await sql`
    INSERT INTO sessions (user_id, session_token, expires_at)
    VALUES (${userId}, ${sessionToken}, ${expiresAt})
  `

  const cookieStore = await cookies()
  cookieStore.set("session", sessionToken, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  return sessionToken
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) return null

    const sessions = await sql`
      SELECT s.*, u.id, u.email, u.name, u.subscription_status, u.is_verified
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
    `

    if (sessions.length === 0) {
      // Clean up invalid session cookie
      cookieStore.delete("session")
      return null
    }

    return sessions[0]
  } catch (error) {
    console.error("Get session error:", error)
    return null
  }
}

export async function deleteSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
    }

    cookieStore.delete("session")
  } catch (error) {
    console.error("Delete session error:", error)
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
