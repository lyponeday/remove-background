import type React from "react"
import { redirect } from "next/navigation"

export default function DevToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 只在开发环境允许访问
  if (process.env.NODE_ENV !== "development") {
    redirect("/")
  }

  return <>{children}</>
}
