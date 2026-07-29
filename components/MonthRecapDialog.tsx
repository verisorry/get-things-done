"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CheckCircle2, Circle, Target, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useMonthRecap } from "@/hooks/use-month-recap"
import { cn } from "@/lib/utils"
import type { MonthlyGoal, Task } from "@/lib/types"

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function computeStats(
  tasks: Task[],
  meals: { date: string; meal: string }[],
  daysInMonth: number
) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const timeBlockedTasks = tasks.filter((t) => t.time_start && t.time_end)
  const totalMinutes = timeBlockedTasks.reduce((acc, t) => {
    return acc + timeToMinutes(t.time_end!) - timeToMinutes(t.time_start!)
  }, 0)
  const totalHours = totalMinutes / 60

  const tierCounts = {
    focus: { total: 0, done: 0 },
    important: { total: 0, done: 0 },
    immediate: { total: 0, done: 0 },
    other: { total: 0, done: 0 },
  } as Record<string, { total: number; done: number }>
  for (const t of tasks) {
    tierCounts[t.tier].total++
    if (t.completed) tierCounts[t.tier].done++
  }

  // Meal coverage
  const daysWithLunch = new Set(meals.filter((m) => m.meal === "lunch").map((m) => m.date))
  const daysWithDinner = new Set(meals.filter((m) => m.meal === "dinner").map((m) => m.date))
  const daysWithAnyMeal = new Set([...daysWithLunch, ...daysWithDinner])
  const daysFullyPlanned = [...daysWithLunch].filter((d) => daysWithDinner.has(d)).length
  const daysNotPlanned = daysInMonth - daysWithAnyMeal.size

  // Best day (most completions)
  const completedByDay: Record<string, number> = {}
  for (const t of tasks.filter((t) => t.completed)) {
    completedByDay[t.date] = (completedByDay[t.date] ?? 0) + 1
  }
  const bestDayEntry = Object.entries(completedByDay).sort((a, b) => b[1] - a[1])[0]
  const bestDay = bestDayEntry
    ? { date: bestDayEntry[0], count: bestDayEntry[1] }
    : null

  // Active days (at least one task completed)
  const activeDays = new Set(tasks.filter((t) => t.completed).map((t) => t.date)).size

  return {
    totalTasks,
    completedTasks,
    completionRate,
    totalHours,
    timeBlockedCount: timeBlockedTasks.length,
    tierCounts,
    daysWithAnyMeal: daysWithAnyMeal.size,
    daysFullyPlanned,
    daysNotPlanned,
    bestDay,
    activeDays,
  }
}

export function MonthRecapDialog() {
  const { data, dismiss, carryOverGoals } = useMonthRecap()
  const [carriedGoals, setCarriedGoals] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)
  const [carrying, setCarrying] = useState(false)

  if (data && !initialized) {
    setCarriedGoals(new Set(data.goals.map((g) => g.id)))
    setInitialized(true)
  }

  if (!data) return null

  const monthName = format(new Date(data.year, data.month - 1), "MMMM yyyy")
  const newMonthName = format(new Date(), "MMMM")
  const stats = computeStats(data.tasks, data.meals, data.daysInMonth)

  function toggleGoal(id: string) {
    setCarriedGoals((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleCarryOver() {
    setCarrying(true)
    await carryOverGoals([...carriedGoals])
    dismiss()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) dismiss() }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Month in Review
          </div>
          <DialogTitle className="text-2xl font-bold">{monthName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 px-6 pb-6">
            {/* Hero stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                value={`${stats.completedTasks}/${stats.totalTasks}`}
                label="Tasks completed"
                sub={`${stats.completionRate}% done`}
                accent={stats.completionRate >= 70}
              />
              <StatCard
                value={stats.totalHours >= 1 ? `${stats.totalHours.toFixed(1)}h` : `${Math.round(stats.totalHours * 60)}m`}
                label="Time blocked"
                sub={`${stats.timeBlockedCount} scheduled tasks`}
              />
              <StatCard
                value={`${stats.daysWithAnyMeal}/${data.daysInMonth}`}
                label="Days with meals"
                sub={`${stats.daysFullyPlanned} fully planned`}
                accent={stats.daysWithAnyMeal / data.daysInMonth >= 0.7}
              />
              <StatCard
                value={`${stats.activeDays}`}
                label="Active days"
                sub={stats.bestDay ? `${stats.bestDay.count} tasks on ${format(new Date(stats.bestDay.date + "T12:00:00"), "MMM d")}` : "no completions"}
                accent={stats.activeDays >= Math.round(data.daysInMonth * 0.5)}
              />
            </div>

            {/* Tier breakdown */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                By priority
              </p>
              <div className="flex flex-col gap-1.5">
                {(["focus", "important", "immediate", "other"] as const).map((tier) => {
                  const { total, done } = stats.tierCounts[tier]
                  if (total === 0) return null
                  const pct = Math.round((done / total) * 100)
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <span
                        className={cn("w-16 text-right text-[10px] font-medium capitalize text-muted-foreground")}
                      >
                        {tier}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-300 ease-out",
                            tier === "focus" && "bg-foreground",
                            tier === "important" && "bg-tier-important",
                            tier === "immediate" && "bg-tier-immediate",
                            tier === "other" && "bg-tier-other"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-[10px] text-muted-foreground">
                        {done}/{total} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Meal breakdown */}
            <div className="flex items-start gap-3 rounded-xl bg-secondary/50 px-4 py-3">
              <UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <span className="font-medium">{stats.daysWithAnyMeal} days</span> with at least one meal planned,{" "}
                <span className="font-medium">{stats.daysFullyPlanned} days</span> with both lunch & dinner.{" "}
                {stats.daysNotPlanned > 0 && (
                  <span className="text-muted-foreground">{stats.daysNotPlanned} days unplanned.</span>
                )}
              </div>
            </div>

            {/* Monthly goals */}
            {data.goals.length > 0 && (
              <div>
                <Separator className="mb-4" />
                <div className="mb-3 flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Monthly Goals
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {data.goals.map((goal) => (
                    <GoalRecapRow
                      key={goal.id}
                      goal={goal}
                      daysInMonth={data.daysInMonth}
                      checked={carriedGoals.has(goal.id)}
                      onToggle={() => toggleGoal(goal.id)}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Checked goals will be carried over to {newMonthName}.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
              Skip
            </Button>
            <Button
              size="sm"
              className="ml-auto"
              onClick={handleCarryOver}
              disabled={carrying}
            >
              {carrying ? "Carrying over…" : `Start ${newMonthName} →`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({
  value,
  label,
  sub,
  accent = false,
}: {
  value: string
  label: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl bg-secondary/50 px-4 py-3">
      <div className={cn("text-2xl font-bold", accent && "text-foreground")}>
        {value}
      </div>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  )
}

function GoalRecapRow({
  goal,
  daysInMonth,
  checked,
  onToggle,
}: {
  goal: MonthlyGoal
  daysInMonth: number
  checked: boolean
  onToggle: () => void
}) {
  const count = goal.completed_dates.length
  const target = goal.target_count ?? daysInMonth
  const pct = Math.min(Math.round((count / target) * 100), 100)
  const hit = goal.target_count ? count >= goal.target_count : count > 0

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{goal.title}</span>
          {hit ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
          ) : (
            <Circle className="size-3.5 shrink-0 text-muted-foreground/40" />
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full", hit ? "bg-foreground" : "bg-muted-foreground/40")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {count}{goal.target_count ? `/${goal.target_count}` : ""} days
          </span>
        </div>
      </div>
    </div>
  )
}
