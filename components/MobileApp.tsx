"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, startOfWeek, getMonth, getYear } from "date-fns"
import Image from "next/image"
import { CheckSquare, ChevronLeft, ChevronRight, LogOut, Target, Trash2, UtensilsCrossed } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDay } from "@/hooks/use-day"
import { useMealPlan } from "@/hooks/use-meal-plan"
import { useWeekMealPlan } from "@/hooks/use-week-meal-plan"
import { useMonthlyGoals } from "@/hooks/use-monthly-goals"
import { useDemoContext } from "@/lib/demo-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Task, TaskTier, MonthlyGoal, MealType } from "@/lib/types"

const today = new Date()
const todayStr = format(today, "yyyy-MM-dd")

function formatMobileTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const period = h < 12 ? "AM" : "PM"
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  const minutes = String(m).padStart(2, "0")
  return `${hour}:${minutes} ${period}`
}

const TIERS: { key: TaskTier; label: string; dot: string }[] = [
  { key: "focus",     label: "Focus",     dot: "bg-tier-focus" },
  { key: "important", label: "Important", dot: "bg-tier-important" },
  { key: "immediate", label: "Immediate", dot: "bg-tier-immediate" },
  { key: "other",     label: "Other",     dot: "bg-tier-other" },
]

const TIER_CHECKBOX: Record<TaskTier, string> = {
  focus:     "border-tier-focus",
  important: "border-tier-important",
  immediate: "border-tier-immediate",
  other:     "border-tier-other",
}

export function MobileApp() {
  const [tab, setTab] = useState<"tasks" | "meals">("tasks")
  const demo = useDemoContext()
  const router = useRouter()

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace("/auth/login")
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "tasks" ? <TasksTab /> : <MealsTab />}
      </div>

      {!demo && (
        <button
          onClick={handleSignOut}
          className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-50 flex size-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          <LogOut className="size-4" />
        </button>
      )}

      <div className="pointer-events-none fixed right-0 bottom-[max(2rem,env(safe-area-inset-bottom))] left-0 z-50 flex justify-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "tasks" | "meals")} className="pointer-events-auto">
          <TabsList className="!h-12 px-1">
            <TabsTrigger value="tasks" className="gap-2 px-6 text-base">
              <CheckSquare className="size-5" />
              Today
            </TabsTrigger>
            <TabsTrigger value="meals" className="gap-2 px-6 text-base">
              <UtensilsCrossed className="size-5" />
              Meals
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}

function TasksTab() {
  const { tasks, addTask, updateTask, deleteTask } = useDay(todayStr)
  const { goals, toggleDate } = useMonthlyGoals(getYear(today), getMonth(today) + 1)
  const { lunch, dinner, upsertMeal } = useMealPlan(todayStr)
  const [addingTier, setAddingTier] = useState<TaskTier | null>(null)
  const [addTitle, setAddTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingTier) inputRef.current?.focus()
  }, [addingTier])

  function handleKeyDown(e: React.KeyboardEvent, tier: TaskTier) {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = addTitle.trim()
      if (trimmed) {
        addTask(tier, trimmed)
        setAddTitle("")
      }
    } else if (e.key === "Escape") {
      setAddTitle("")
      setAddingTier(null)
    }
  }

  function handleBlur(tier: TaskTier) {
    const trimmed = addTitle.trim()
    if (trimmed) addTask(tier, trimmed)
    setAddTitle("")
    setAddingTier(null)
  }

  const completedGoals = goals.filter((g) => g.completed_dates.includes(todayStr)).length
  const total = tasks.length + goals.length
  const completed = tasks.filter((t) => t.completed).length + completedGoals
  const progress = total > 0 ? completed / total : 0

  return (
    <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-36">
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Image src="/logo.png" alt="GTD" width={28} height={28} className="rounded-[7px]" />
          <h1 className="text-2xl font-bold">{format(today, "EEEE")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{format(today, "MMMM d")}</p>
        {total > 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-completed transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <MobileMealsSection
          lunch={lunch}
          dinner={dinner}
          onSave={(meal, title, notes) => upsertMeal(meal, title, notes)}
        />

        {TIERS.map(({ key, label, dot }) => {
          const tierTasks = tasks.filter((t) => t.tier === key)
          const active = tierTasks.filter((t) => !t.completed)
          const done = tierTasks.filter((t) => t.completed)
          const tierGoals = key === "important" ? goals : []

          return (
            <section key={key} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/[0.04] dark:shadow-none dark:border dark:border-white/[0.06]">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", dot)} />
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{label}</span>
                </div>
                <button
                  onClick={() => { setAddTitle(""); setAddingTier(key) }}
                  className="flex size-6 items-center justify-center rounded-full text-lg leading-none text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  +
                </button>
              </div>

              <div className="flex flex-col pb-2">
                {tierGoals.map((goal) => (
                  <MobileGoalRow
                    key={goal.id}
                    goal={goal}
                    date={todayStr}
                    onToggle={() => toggleDate(goal.id, todayStr)}
                  />
                ))}

                {active.map((task) => (
                  <MobileTaskRow key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                ))}

                {addingTier === key && (
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <div className="size-4 shrink-0 rounded-full border border-border" />
                    <input
                      ref={inputRef}
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, key)}
                      onBlur={() => handleBlur(key)}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="New task..."
                    />
                  </div>
                )}

                {done.map((task) => (
                  <MobileTaskRow key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function MobileMealsSection({
  lunch,
  dinner,
  onSave,
}: {
  lunch: import("@/lib/types").MealPlan | null
  dinner: import("@/lib/types").MealPlan | null
  onSave: (meal: MealType, title: string, notes: string | null) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/[0.04] dark:border dark:border-white/[0.06] dark:shadow-none">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <UtensilsCrossed className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Meals</span>
      </div>
      <div className="flex flex-col pb-2">
        <MobileMealRow label="Lunch" meal="lunch" data={lunch} onSave={onSave} />
        <MobileMealRow label="Dinner" meal="dinner" data={dinner} onSave={onSave} />
      </div>
    </section>
  )
}

function MobileMealRow({
  label,
  meal,
  data,
  onSave,
}: {
  label: string
  meal: MealType
  data: import("@/lib/types").MealPlan | null
  onSave: (meal: MealType, title: string, notes: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setTitle(data?.title ?? "")
      setNotes(data?.notes ?? "")
    }
    setOpen(isOpen)
  }

  function handleSave() {
    const trimmed = title.trim()
    if (trimmed) onSave(meal, trimmed, notes.trim() || null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
          <span className="w-12 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className={cn("flex-1 truncate text-sm", data ? "text-foreground" : "text-muted-foreground/40")}>
            {data?.title ?? "—"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave() } }}
          placeholder="Dish name"
          autoFocus
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ingredients, notes..."
          className="min-h-10 text-xs"
        />
        <Button onClick={handleSave} size="sm" className="w-full">Save</Button>
      </PopoverContent>
    </Popover>
  )
}

function MobileTaskRow({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-2.5", task.completed && "opacity-50")}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onUpdate(task.id, { completed: checked === true })}
        className={cn("mt-px shrink-0", TIER_CHECKBOX[task.tier], "data-checked:border-completed data-checked:bg-completed")}
      />
      <div className="flex-1">
        <span className={cn("block break-words text-sm", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </span>
        {task.time_start && (
          <span className="text-[11px] text-muted-foreground">
            {formatMobileTime(task.time_start)}
            {task.time_end && ` – ${formatMobileTime(task.time_end)}`}
          </span>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="mt-px shrink-0 text-muted-foreground/40 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

function MobileGoalRow({
  goal,
  date,
  onToggle,
}: {
  goal: MonthlyGoal
  date: string
  onToggle: () => void
}) {
  const done = goal.completed_dates.includes(date)

  return (
    <button
      onClick={onToggle}
      className={cn("flex w-full items-start gap-3 px-4 py-2.5 text-left transition-opacity", done && "opacity-50")}
    >
      <div className={cn(
        "mt-px flex size-4 shrink-0 items-center justify-center rounded-full border border-tier-important transition-colors",
        done && "border-completed bg-completed"
      )}>
        {done && <span className="text-[8px] text-white">✓</span>}
      </div>
      <span className={cn("flex-1 break-words text-sm", done && "line-through text-muted-foreground")}>
        {goal.title}
      </span>
      <Target className="mt-px size-3.5 shrink-0 text-tier-important opacity-40" />
    </button>
  )
}

function MealsTab() {
  const [weekOffset, setWeekOffset] = useState(0)
  const baseStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekStart = addDays(baseStart, weekOffset * 7)
  const weekEnd = addDays(weekStart, 6)
  const weekStartStr = format(weekStart, "yyyy-MM-dd")

  const { getMeal, upsertMeal } = useWeekMealPlan(weekStartStr)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-36">
      <div className="mb-4 flex items-center gap-2">
        <Image src="/logo.png" alt="GTD" width={28} height={28} className="rounded-[7px]" />
        <h1 className="text-2xl font-bold">Meals</h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const isToday = dateStr === todayStr

          return (
            <section
              key={dateStr}
              className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/[0.04] dark:border dark:border-white/[0.06] dark:shadow-none"
            >
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-[0.06em] uppercase",
                    isToday ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEEE, MMM d")}
                </span>
                {isToday && (
                  <Badge variant="secondary" className="text-[9px]">Today</Badge>
                )}
              </div>
              <div className="flex flex-col pb-2">
                <MobileMealRow
                  label="Lunch"
                  meal="lunch"
                  data={getMeal(dateStr, "lunch")}
                  onSave={(meal, title, notes) => upsertMeal(dateStr, meal, title, notes)}
                />
                <MobileMealRow
                  label="Dinner"
                  meal="dinner"
                  data={getMeal(dateStr, "dinner")}
                  onSave={(meal, title, notes) => upsertMeal(dateStr, meal, title, notes)}
                />
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
