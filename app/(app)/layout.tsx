"use client"

import { GoalsSidebar } from "@/components/GoalsSidebar"
import { InboxPanel } from "@/components/InboxPanel"
import { MobileApp } from "@/components/MobileApp"
import { MonthRecapDialog } from "@/components/MonthRecapDialog"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/60 shadow-none backdrop-blur-[20px] dark:border-white/[0.06] dark:bg-white/[0.03]">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
