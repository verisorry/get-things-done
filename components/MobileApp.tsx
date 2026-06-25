"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, getMonth, getYear } from "date-fns"
import Image from "next/image"
import { CalendarDays, CheckSquare, Inbox, LogOut, Target, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDay } from "@/hooks/use-day"
import { useInbox } from "@/hooks/use-inbox"
import { useMonthlyGoals } from "@/hooks/use-monthly-goals"
import { useDemoContext } from "@/lib/demo-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Task, TaskTier, InboxItem, MonthlyGoal } from "@/lib/types"

const today = new Date()
const todayStr = format(today, "yyyy-MM-dd")
const todayLabel = format(today, "EEEE, MMMM d")

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

function parseInput(value: string): { title: string; tag: string | null } {
  const match = value.match(/@(\S+)/)
  if (!match) return { title: value.trim(), tag: null }
  const tag = match[1]
  const title = value.replace(match[0], "").trim()
  return { title: title || tag, tag }
}

export function MobileApp() {
  const [tab, setTab] = useState<"tasks" | "inbox">("tasks")
  const demo = useDemoContext()
  const router = useRouter()

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.replace("/auth/login")
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "tasks" ? <TasksTab /> : <InboxTab />}
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
        <Tabs value={tab} onValueChange={(v) => setTab(v as "tasks" | "inbox")} className="pointer-events-auto">
          <TabsList className="!h-12 px-1">
            <TabsTrigger value="tasks" className="gap-2 px-6 text-base">
              <CheckSquare className="size-5" />
              Today
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2 px-6 text-base">
              <Inbox className="size-5" />
              Inbox
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
      <span className={cn("flex-1 break-words text-sm", task.completed && "line-through text-muted-foreground")}>
        {task.title}
      </span>
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

function InboxTab() {
  const { items, addItem, delegateItem, deleteItem, markDelegated } = useInbox()
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleReturn(e: Event) {
      const { title } = (e as CustomEvent).detail
      addItem(title, null)
    }
    window.addEventListener("task-to-inbox", handleReturn)
    return () => window.removeEventListener("task-to-inbox", handleReturn)
  }, [addItem])

  const grouped = useMemo(() => {
    const untagged: InboxItem[] = []
    const tagMap = new Map<string, InboxItem[]>()
    for (const item of items) {
      if (item.tag) {
        const list = tagMap.get(item.tag) || []
        list.push(item)
        tagMap.set(item.tag, list)
      } else {
        untagged.push(item)
      }
    }
    return { untagged, tags: Array.from(tagMap.entries()).sort((a, b) => a[0].localeCompare(b[0])) }
  }, [items])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      const { title, tag } = parseInput(inputValue)
      if (title) {
        addItem(title, tag)
        setInputValue("")
      }
    } else if (e.key === "Escape") {
      setInputValue("")
      inputRef.current?.blur()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5">
        <div className="mb-4 flex items-center gap-2">
          <Image src="/logo.png" alt="GTD" width={28} height={28} className="rounded-[7px]" />
          <h1 className="text-2xl font-bold">Inbox</h1>
          {items.length > 0 && (
            <Badge variant="secondary">{items.length}</Badge>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16">
            <p className="text-sm font-medium text-muted-foreground">All clear!</p>
            <p className="text-center text-xs text-muted-foreground/60">Add something below</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.untagged.length > 0 && (
              <MobileInboxSection label="Inbox" items={grouped.untagged} onDelegate={delegateItem} onDelete={deleteItem} />
            )}
            {grouped.tags.map(([tag, tagItems]) => (
              <MobileInboxSection key={tag} label={tag} items={tagItems} onDelegate={delegateItem} onDelete={deleteItem} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/80 bg-white/60 px-4 py-3 pb-36 backdrop-blur-[20px] dark:border-white/[0.06] dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 dark:bg-white/[0.06]">
          <div className="size-4 shrink-0 rounded-full border border-border" />
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Add to inbox... @tag"
          />
        </div>
      </div>
    </div>
  )
}

function MobileInboxSection({
  label,
  items,
  onDelegate,
  onDelete,
}: {
  label: string
  items: InboxItem[]
  onDelegate: (id: string, date: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/[0.04] dark:border dark:border-white/[0.06] dark:shadow-none">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="size-2 rounded-full bg-muted-foreground/50" />
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </span>
        <Badge variant="secondary" className="ml-auto text-[9px]">{items.length}</Badge>
      </div>
      <div className="flex flex-col px-2 pb-2">
        {items.map((item) => (
          <MobileInboxRow key={item.id} item={item} onDelegate={onDelegate} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}

function MobileInboxRow({
  item,
  onDelegate,
  onDelete,
}: {
  item: InboxItem
  onDelegate: (id: string, date: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const todayDate = format(new Date(), "yyyy-MM-dd")
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")

  function delegate(date: string) {
    onDelegate(item.id, date)
    setOpen(false)
  }

  return (
    <div className="flex items-start gap-2 rounded-lg px-2 py-2">
      <span className="flex-1 break-words text-sm">{item.title}</span>

      <div className="flex shrink-0 items-center gap-0.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <CalendarDays className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 gap-1 p-2">
            <Button variant="ghost" size="sm" onClick={() => delegate(todayDate)} className="w-full justify-start text-xs">Today</Button>
            <Button variant="ghost" size="sm" onClick={() => delegate(tomorrow)} className="w-full justify-start text-xs">Tomorrow</Button>
            <Separator className="my-1" />
            <input
              type="date"
              onChange={(e) => { if (e.target.value) delegate(e.target.value) }}
              className="w-full rounded-md bg-secondary px-2 py-1.5 text-xs outline-none"
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="size-7">
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
