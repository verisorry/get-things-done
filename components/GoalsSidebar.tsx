"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { format, getDaysInMonth } from "date-fns"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Plus,
  Sun,
  Target,
  Trash2,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { MealPlanPanel } from "@/components/MealPlanPanel"
import { useTheme } from "@/components/ThemeProvider"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMonthlyGoals } from "@/hooks/use-monthly-goals"
import { cn } from "@/lib/utils"
import type { MonthlyGoal } from "@/lib/types"

type Panel = "goals" | "meals"
const RAIL_W = 48
const PANEL_W_DEFAULT = 300
const PANEL_W_MIN = 200
const PANEL_W_MAX = 520
const STORAGE_KEY = "sidebar-panel"
const STORAGE_KEY_WIDTH = "sidebar-panel-width"

let panelValue: Panel | null = null
const panelListeners = new Set<() => void>()
function subscribePanelStore(cb: () => void) {
  panelListeners.add(cb)
  return () => panelListeners.delete(cb)
}
function getPanelSnapshot() { return panelValue }
function getPanelServerSnapshot() { return null as Panel | null }
function setPanelValue(v: Panel | null) {
  panelValue = v
  panelListeners.forEach((cb) => cb())
}

export function GoalsSidebar() {
  const { theme, toggle: toggleTheme } = useTheme()
  const activePanel = useSyncExternalStore(subscribePanelStore, getPanelSnapshot, getPanelServerSnapshot)
  const [ready, setReady] = useState(false)
  const [panelW, setPanelW] = useState(() => {
    if (typeof window === "undefined") return PANEL_W_DEFAULT
    const storedW = window.localStorage.getItem(STORAGE_KEY_WIDTH)
    const n = storedW ? parseInt(storedW) : NaN
    return n >= PANEL_W_MIN && n <= PANEL_W_MAX ? n : PANEL_W_DEFAULT
  })
  const [isResizing, setIsResizing] = useState(false)
  const resizing = useRef(false)
  const startX = useRef(0)
  const startW = useRef(PANEL_W_DEFAULT)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { goals, loading, addGoal, toggleDate, deleteGoal } = useMonthlyGoals(
    year,
    month
  )

  const [addOpen, setAddOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newTarget, setNewTarget] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "goals" || stored === "meals") setPanelValue(stored)
    requestAnimationFrame(() => setReady(true))
  }, [])

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = true
    setIsResizing(true)
    startX.current = e.clientX
    startW.current = panelW

    function onMouseMove(ev: MouseEvent) {
      if (!resizing.current) return
      const delta = ev.clientX - startX.current
      const next = Math.min(PANEL_W_MAX, Math.max(PANEL_W_MIN, startW.current + delta))
      setPanelW(next)
    }

    function onMouseUp(ev: MouseEvent) {
      resizing.current = false
      setIsResizing(false)
      const delta = ev.clientX - startX.current
      const next = Math.min(PANEL_W_MAX, Math.max(PANEL_W_MIN, startW.current + delta))
      localStorage.setItem(STORAGE_KEY_WIDTH, String(next))
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }, [panelW])

  function togglePanel(panel: Panel) {
    const next = activePanel === panel ? null : panel
    setPanelValue(next)
    localStorage.setItem(STORAGE_KEY, next ?? "")
  }

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const monthDate = new Date(year, month - 1)
  const daysInMonth = getDaysInMonth(monthDate)
  const todayStr = format(now, "yyyy-MM-dd")

  function handleAdd() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const target = newTarget ? parseInt(newTarget) : null
    addGoal(trimmed, target && target > 0 ? target : null)
    setNewTitle("")
    setNewTarget("")
    setAddOpen(false)
  }

  const totalW = RAIL_W + panelW

  return (
    <aside
      style={{ width: activePanel ? totalW : RAIL_W }}
      className={cn(
        "relative flex h-full shrink-0 overflow-hidden border-r border-white/80 bg-white/60 backdrop-blur-[20px] reduced-transparency:bg-white reduced-transparency:backdrop-blur-none contrast-more:border-r-2 contrast-more:border-foreground/40 contrast-more:bg-white contrast-more:backdrop-blur-none dark:border-r-white/[0.06] dark:bg-white/[0.03] reduced-transparency:dark:bg-[#1a1a1f] dark:contrast-more:bg-[#1a1a1f]",
        ready && !isResizing && "transition-[width] duration-200 ease-in-out"
      )}
    >
      <div className="flex h-full" style={{ width: totalW }}>
        {/* Icon rail */}
        <div className="flex w-12 shrink-0 flex-col items-center border-r border-border pt-3 pb-3">
          <Image
            src="/logo.png"
            alt="Get Things Done"
            width={28}
            height={28}
            className="mb-3 size-7 rounded-lg"
          />
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => togglePanel("goals")}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                activePanel === "goals"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Monthly goals"
            >
              <Target className="size-[18px]" />
            </button>
            <button
              onClick={() => togglePanel("meals")}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                activePanel === "meals"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Meal plan"
            >
              <UtensilsCrossed className="size-[18px]" />
            </button>
          </div>

          <div className="mt-auto">
            <button
              onClick={toggleTheme}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? (
                <Moon className="size-[18px]" />
              ) : (
                <Sun className="size-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {activePanel === "goals" && (
            <>
              <div className="flex h-11 shrink-0 items-center px-3">
                <span className="text-sm font-semibold">Monthly Goals</span>
              </div>

              <Separator />

              <div className="flex shrink-0 items-center justify-between px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  {format(monthDate, "MMM yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={nextMonth}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <Separator />

              <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
                {loading ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Loading...
                  </p>
                ) : goals.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No goals yet
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {goals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          year={year}
                          month={month}
                          daysInMonth={daysInMonth}
                          todayStr={todayStr}
                          onToggle={toggleDate}
                          onDelete={deleteGoal}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="mt-2 w-full justify-start text-[#007aff]"
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Goal
                </Button>
              </div>
            </>
          )}

          {activePanel === "meals" && (
            <>
              <div className="flex h-11 shrink-0 items-center px-3">
                <span className="text-sm font-semibold">Meal Plan</span>
              </div>

              <Separator />

              <div className="flex min-h-0 flex-1 flex-col pt-2.5">
                <MealPlanPanel />
              </div>
            </>
          )}
        </div>
      </div>

      {activePanel && (
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#007aff]/30 active:bg-[#007aff]/50"
          style={{ zIndex: 10 }}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Goal</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              placeholder="Goal title"
              autoFocus
            />
            <Input
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="Target days (optional)"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} size="sm">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}

function GoalCard({
  goal,
  year,
  month,
  daysInMonth,
  todayStr,
  onToggle,
  onDelete,
}: {
  goal: MonthlyGoal
  year: number
  month: number
  daysInMonth: number
  todayStr: string
  onToggle: (goalId: string, date: string) => void
  onDelete: (goalId: string) => void
}) {
  const count = goal.completed_dates.length
  const progress = goal.target_count
    ? Math.min(count / goal.target_count, 1)
    : null

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="group rounded-[12px] bg-card p-2.5 shadow-sm dark:border dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none">
      <div className="mb-1 flex items-start justify-between">
        <h3 className="pr-4 text-xs font-semibold leading-tight">
          {goal.title}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(goal.id)}
          className="-mr-0.5 -mt-0.5 size-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="size-3 text-muted-foreground" />
        </Button>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">
          {count}
          {goal.target_count ? `/${goal.target_count}` : ""} days
        </span>
        {progress !== null && (
          <div className="h-1 flex-1 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = format(
            new Date(year, month - 1, day),
            "yyyy-MM-dd"
          )
          const done = goal.completed_dates.includes(dateStr)
          const isToday = dateStr === todayStr

          return (
            <button
              key={day}
              onClick={() => onToggle(goal.id, dateStr)}
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[8px] font-medium transition-colors",
                done
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary",
                isToday && !done && "ring-1 ring-ring"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
