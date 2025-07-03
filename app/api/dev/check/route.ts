import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    isDev: process.env.NODE_ENV === "development",
  })
}
