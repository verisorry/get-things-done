"use client"

import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useDemoContext } from "@/lib/demo-context"
import { Badge } from "@/components/ui/badge"
import { LogIn } from "lucide-react"

interface TopBarProps {
  currentDate: string
  onTodayClick: () => void
}

export function TopBar({ currentDate, onTodayClick }: TopBarProps) {
  const date = parseISO(currentDate)
  const demo = useDemoContext()
  const router = useRouter()

  return (
    <header className="flex h-11 shrink-0 items-center justify-between px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onTodayClick}
        className="font-medium text-[#007aff]"
      >
        Today
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium tracking-tight">
          {format(date, "EEEE, MMMM d")}
        </span>
        {demo && (
          <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
            Demo
          </Badge>
        )}
      </div>

      {demo ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/auth/login")}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <LogIn className="size-3.5" />
          Sign in
        </Button>
      ) : (
        <div className="w-[52px]" />
      )}
    </header>
  )
}
