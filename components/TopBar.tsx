"use client"

import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"

interface TopBarProps {
  currentDate: string
  onTodayClick: () => void
}

export function TopBar({ currentDate, onTodayClick }: TopBarProps) {
  const date = parseISO(currentDate)

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

      <span className="text-sm font-medium tracking-tight">
        {format(date, "EEEE, MMMM d")}
      </span>

      <div className="w-[52px]" />
    </header>
  )
}
