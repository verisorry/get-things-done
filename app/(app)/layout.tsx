"use client"

import { MotionConfig } from "motion/react"
import { GoalsSidebar } from "@/components/GoalsSidebar"
import { InboxPanel } from "@/components/InboxPanel"
import { MobileApp } from "@/components/MobileApp"
import { MonthRecapDialog } from "@/components/MonthRecapDialog"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // "user" defers to the OS prefers-reduced-motion setting: every motion.*
    // animation in the app automatically drops transform/scale and keeps
    // opacity-only transitions for anyone who has it enabled.
    <MotionConfig reducedMotion="user">
      <MonthRecapDialog />

      {/* Mobile */}
      <div className="flex h-full w-full md:hidden">
        <MobileApp />
      </div>

      {/* Desktop */}
      <div className="hidden h-full md:flex">
        <GoalsSidebar />
        <div className="flex min-w-0 flex-1 gap-3 p-3">
          <InboxPanel />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/60 shadow-none backdrop-blur-[20px] reduced-transparency:bg-white reduced-transparency:backdrop-blur-none contrast-more:border-2 contrast-more:border-foreground/40 contrast-more:bg-white contrast-more:backdrop-blur-none dark:border-white/[0.06] dark:bg-white/[0.03] reduced-transparency:dark:bg-[#1a1a1f] dark:contrast-more:bg-[#1a1a1f]">
            {children}
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
