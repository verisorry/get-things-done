"use client"

import { Fragment, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useWeekMealPlan } from "@/hooks/use-week-meal-plan"
import { cn } from "@/lib/utils"
import type { MealPlan, MealType } from "@/lib/types"

export function MealPlanPanel() {
  const [weekOffset, setWeekOffset] = useState(0)

  const baseStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStart = addDays(baseStart, weekOffset * 7)
  const weekEnd = addDays(weekStart, 6)
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const { getMeal, upsertMeal } = useWeekMealPlan(weekStartStr)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="shrink-0 px-2.5 pb-2.5">
      <div className="flex items-center justify-between py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="text-[10px] font-medium text-muted-foreground">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-[28px_1fr_1fr] gap-x-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        <span />
        <span className="text-center">L</span>
        <span className="text-center">D</span>
      </div>

      <div className="grid grid-cols-[28px_1fr_1fr] gap-x-1 gap-y-0.5">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const isToday = dateStr === todayStr

          return (
            <Fragment key={dateStr}>
              <span
                className={cn(
                  "flex items-center text-[10px]",
                  isToday
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground"
                )}
              >
                {format(day, "EEE")}
              </span>
              <MealCell
                date={dateStr}
                meal="lunch"
                data={getMeal(dateStr, "lunch")}
                onSave={upsertMeal}
              />
              <MealCell
                date={dateStr}
                meal="dinner"
                data={getMeal(dateStr, "dinner")}
                onSave={upsertMeal}
              />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function MealCell({
  date,
  meal,
  data,
  onSave,
}: {
  date: string
  meal: MealType
  data: MealPlan | null
  onSave: (
    date: string,
    meal: MealType,
    title: string,
    notes: string | null
  ) => void
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
    if (trimmed) {
      onSave(date, meal, trimmed, notes.trim() || null)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "truncate rounded px-1.5 py-1 text-left text-[10px] transition-colors",
            data
              ? "bg-secondary font-medium text-foreground"
              : "text-muted-foreground/40 hover:bg-secondary/50"
          )}
        >
          {data?.title ?? "·"}
        </button>
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-56 gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSave()
            }
          }}
          placeholder="Dish name"
          autoFocus
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ingredients, notes..."
          className="min-h-10 text-xs"
        />
        <Button onClick={handleSave} size="sm" className="w-full">
          Save
        </Button>
      </PopoverContent>
    </Popover>
  )
}
