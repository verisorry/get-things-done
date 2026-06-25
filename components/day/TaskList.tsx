"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical, Plus, Target, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TaskCard } from "@/components/day/TaskCard"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Task, TaskTier, MonthlyGoal, MealPlan, MealType } from "@/lib/types"

const TIERS: { key: TaskTier; label: string; tip: string; dot: string; glow: string }[] = [
  { key: "focus", label: "Focus", tip: "What will make today a win", dot: "bg-tier-focus", glow: "shadow-[0_0_6px_rgba(0,0,0,0.4)] dark:shadow-[0_0_6px_rgba(250,250,250,0.4)]" },
  { key: "important", label: "Important", tip: "What will affect your goals", dot: "bg-tier-important", glow: "shadow-[0_0_6px_rgba(245,158,11,0.4)]" },
  { key: "immediate", label: "Immediate", tip: "What must be done today", dot: "bg-tier-immediate", glow: "shadow-[0_0_6px_rgba(239,68,68,0.4)]" },
  { key: "other", label: "Other", tip: "Nice to complete", dot: "bg-tier-other", glow: "shadow-[0_0_6px_rgba(120,113,108,0.4)]" },
]

interface TaskListProps {
  tasks: Task[]
  date: string
  goals?: MonthlyGoal[]
  lunch?: MealPlan | null
  dinner?: MealPlan | null
  onAddTask: (tier: TaskTier, title: string) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onDeleteTask: (id: string) => void
  onToggleGoal?: (goalId: string) => void
  onSendToInbox?: (id: string, title: string) => void
  onSaveMeal?: (meal: MealType, title: string, notes: string | null) => void
}

export function TaskList({
  tasks,
  date,
  goals = [],
  lunch,
  dinner,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleGoal,
  onSendToInbox,
  onSaveMeal,
}: TaskListProps) {
  const [addingTier, setAddingTier] = useState<TaskTier | null>(null)
  const [addTitle, setAddTitle] = useState("")
  const [dropTier, setDropTier] = useState<TaskTier | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingTier) inputRef.current?.focus()
  }, [addingTier])

  function handleKeyDown(e: React.KeyboardEvent, tier: TaskTier) {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = addTitle.trim()
      if (trimmed) {
        onAddTask(tier, trimmed)
        setAddTitle("")
      }
    } else if (e.key === "Escape") {
      setAddTitle("")
      setAddingTier(null)
    }
  }

  function handleBlur(tier: TaskTier) {
    const trimmed = addTitle.trim()
    if (trimmed) {
      onAddTask(tier, trimmed)
    }
    setAddTitle("")
    setAddingTier(null)
  }

  function handleDragOver(e: React.DragEvent, tier: TaskTier) {
    if (!e.dataTransfer.types.includes("application/inbox-id")) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDropTier(tier)
  }

  function handleDragLeave(e: React.DragEvent) {
    const target = e.currentTarget as HTMLElement
    if (!target.contains(e.relatedTarget as Node)) {
      setDropTier(null)
    }
  }

  function handleDrop(e: React.DragEvent, tier: TaskTier) {
    const inboxId = e.dataTransfer.getData("application/inbox-id")
    const title = e.dataTransfer.getData("application/inbox-title")
    if (!inboxId || !title) return
    e.preventDefault()
    e.stopPropagation()
    setDropTier(null)

    onAddTask(tier, title)

    window.dispatchEvent(
      new CustomEvent("inbox-delegated", {
        detail: { id: inboxId, date },
      })
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {TIERS.map(({ key, label, tip, dot, glow }) => {
        const tierTasks = tasks.filter((t) => t.tier === key && !t.source)
        const active = tierTasks.filter((t) => !t.completed)
        const completed = tierTasks.filter((t) => t.completed)

        return (
          <section
            key={key}
            className={cn(
              "group/tier rounded-lg p-1 -m-1 transition-colors",
              dropTier === key && "bg-ring/10 ring-1 ring-ring/30"
            )}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, key)}
          >
            <div className="mb-1 flex items-center justify-between">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-default items-center gap-2">
                      <span className={cn("size-2.5 shrink-0 rounded-full", dot, glow)} />
                      <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {tip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setAddTitle("")
                  setAddingTier(key)
                }}
                className="size-5 opacity-0 transition-opacity group-hover/tier:opacity-100 focus:opacity-100"
              >
                <Plus className="size-3" />
              </Button>
            </div>

            <div className="flex flex-col">
              {key === "important" && goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  date={date}
                  onToggle={() => onToggleGoal?.(goal.id)}
                />
              ))}

              {key === "other" && onSaveMeal && (
                <>
                  <MealTaskRow meal="lunch" data={lunch ?? null} onSave={onSaveMeal} />
                  <MealTaskRow meal="dinner" data={dinner ?? null} onSave={onSaveMeal} />
                </>
              )}

              {active.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onUpdateTask}
                  onDelete={onDeleteTask}
                  onSendToInbox={onSendToInbox}
                />
              ))}

              {addingTier === key && (
                <div className="flex items-center gap-2.5 px-3 py-2.5">
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

              {completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={onUpdateTask}
                  onDelete={onDeleteTask}
                  onSendToInbox={onSendToInbox}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function GoalRow({
  goal,
  date,
  onToggle,
}: {
  goal: MonthlyGoal
  date: string
  onToggle: () => void
}) {
  const done = goal.completed_dates.includes(date)

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("application/goal-id", goal.id)
    e.dataTransfer.setData("application/goal-title", goal.title)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group flex w-full cursor-grab items-center gap-1.5 px-1.5 py-2.5 transition-opacity active:cursor-grabbing",
        done && "opacity-50"
      )}
    >
      <GripVertical className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      <button
        onClick={onToggle}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border border-tier-important transition-colors",
          done && "border-completed bg-completed"
        )}
      >
        {done && <span className="text-[8px] text-white">✓</span>}
      </button>
      <span
        className={cn(
          "flex-1 wrap-break-word text-left text-sm",
          done && "line-through text-muted-foreground"
        )}
      >
        {goal.title}
      </span>
      <Target className="size-3 shrink-0 text-tier-important opacity-40" />
    </div>
  )
}

function MealTaskRow({
  meal,
  data,
  onSave,
}: {
  meal: MealType
  data: MealPlan | null
  onSave: (meal: MealType, title: string, notes: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const label = meal === "lunch" ? "Lunch" : "Dinner"

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("application/meal-title", data?.title ?? label)
    e.dataTransfer.setData("application/meal-type", meal)
    e.dataTransfer.effectAllowed = "move"
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div
        draggable
        onDragStart={handleDragStart}
        className="group flex cursor-grab items-center gap-1.5 px-1.5 py-2.5 active:cursor-grabbing"
      >
        <GripVertical className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
        <Utensils className="size-4 shrink-0 text-muted-foreground/40" />
        <button
          onClick={() => handleOpenChange(true)}
          className={cn(
            "flex-1 text-left text-sm",
            data ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {data?.title ?? label}
        </button>
      </div>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleSave() }
            }}
            placeholder="Dish name"
            autoFocus
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ingredients, prep notes..."
            className="min-h-16 text-sm"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} size="sm">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
