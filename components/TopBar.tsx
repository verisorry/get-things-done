"use client"

import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useDemoContext } from "@/lib/demo-context"
import { Badge } from "@/components/ui/badge"
import { LogIn, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SettingsDialog } from "@/components/SettingsDialog"

interface TopBarProps {
  currentDate: string
  onTodayClick: () => void
}

export function TopBar({ currentDate, onTodayClick }: TopBarProps) {
  const date = parseISO(currentDate)
  const demo = useDemoContext()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace("/auth/login")
  }

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
        <Image src="/logo.png" alt="GTD" width={20} height={20} className="rounded-[5px]" />
        <span className="text-sm font-medium tracking-tight">
          {format(date, "EEEE, MMMM d")}
        </span>
        {demo && (
          <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
            Demo
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSettingsOpen(true)}
          className="text-muted-foreground"
        >
          <Settings className="size-3.5" />
        </Button>

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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        )}
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}
