"use client"

import { useSearchParams } from "next/navigation"
import { DemoProvider } from "@/lib/demo-context"

export function DemoWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"

  if (isDemo) {
    return <DemoProvider>{children}</DemoProvider>
  }

  return <>{children}</>
}
