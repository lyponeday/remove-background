"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function DevNav() {
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // 通过API检查是否为开发环境
    fetch("/api/dev/check")
      .then((res) => res.json())
      .then((data) => setIsDev(data.isDev))
      .catch(() => setIsDev(false))
  }, [])

  if (!isDev) return null

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/dev-tools" className="text-orange-500">
        Dev Tools
      </Link>
    </Button>
  )
}
