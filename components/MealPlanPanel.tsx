"use client"

import { Fragment, useRef, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useWeekMealPlan } from "@/hooks/use-week-meal-plan"
import { usePantry } from "@/hooks/use-pantry"
import { cn } from "@/lib/utils"
import type { MealPlan, MealType, PantryItem } from "@/lib/types"

type DragKey = { date: string; meal: MealType }

export function MealPlanPanel() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dragOver, setDragOver] = useState<DragKey | null>(null)
  const dragSource = useRef<DragKey | null>(null)

  const baseStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStart = addDays(baseStart, weekOffset * 7)
  const weekEnd = addDays(weekStart, 6)
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const { getMeal, upsertMeal, deleteMeal, swapMeals } = useWeekMealPlan(weekStartStr)
  const { items: pantryItems, addItem: addPantryItem, toggleItem: togglePantryItem, deleteItem: deletePantryItem } = usePantry(weekStartStr)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function handleDragStart(date: string, meal: MealType) {
    dragSource.current = { date, meal }
  }

  function handleDrop(toDate: string, toMeal: MealType) {
    const from = dragSource.current
    if (!from) return
    if (from.date === toDate && from.meal === toMeal) return
    swapMeals(from.date, from.meal, toDate, toMeal)
    dragSource.current = null
    setDragOver(null)
  }

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
              {(["lunch", "dinner"] as MealType[]).map((mealType) => (
                <MealCell
                  key={mealType}
                  date={dateStr}
                  meal={mealType}
                  data={getMeal(dateStr, mealType)}
                  isDropTarget={dragOver?.date === dateStr && dragOver?.meal === mealType}
                  onSave={upsertMeal}
                  onDelete={deleteMeal}
                  onDragStart={handleDragStart}
                  onDragOver={(date, meal) => setDragOver({ date, meal })}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={handleDrop}
                />
              ))}
            </Fragment>
          )
        })}
      </div>

      <Separator className="my-3" />

      <PantrySection
        items={pantryItems}
        onAdd={addPantryItem}
        onToggle={togglePantryItem}
        onDelete={deletePantryItem}
      />
    </div>
  )
}

function PantrySection({
  items,
  onAdd,
  onToggle,
  onDelete,
}: {
  items: PantryItem[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [newTitle, setNewTitle] = useState("")

  function handleAdd() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewTitle("")
  }

  return (
    <div>
      <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        Pantry
      </span>

      <div className="mt-1.5 flex flex-col gap-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-secondary/50"
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => onToggle(item.id)}
              className="size-3.5"
            />
            <span
              className={cn(
                "flex-1 truncate text-[11px]",
                item.checked && "text-muted-foreground/50 line-through"
              )}
            >
              {item.title}
            </span>
            <button
              onClick={() => onDelete(item.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="size-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex items-center gap-1">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Add ingredient..."
          className="h-6 flex-1 text-[11px]"
        />
        <Button
          onClick={handleAdd}
          size="icon"
          variant="ghost"
          className="size-6 shrink-0"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function MealCell({
  date,
  meal,
  data,
  isDropTarget,
  onSave,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  date: string
  meal: MealType
  data: MealPlan | null
  isDropTarget: boolean
  onSave: (date: string, meal: MealType, title: string, notes: string | null) => void
  onDelete: (date: string, meal: MealType) => void
  onDragStart: (date: string, meal: MealType) => void
  onDragOver: (date: string, meal: MealType) => void
  onDragLeave: () => void
  onDrop: (date: string, meal: MealType) => void
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

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete(date, meal)
  }

  return (
    <div className="group relative min-w-0">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            draggable={!!data}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move"
              onDragStart(date, meal)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              onDragOver(date, meal)
            }}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
              e.preventDefault()
              onDrop(date, meal)
            }}
            className={cn(
              "w-full truncate rounded px-1.5 py-1 text-left text-[10px] transition-colors",
              data
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground/40 hover:bg-secondary/50",
              isDropTarget && "ring-1 ring-[#007aff]"
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
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              Save
            </Button>
            {data && (
              <Button
                onClick={() => {
                  onDelete(date, meal)
                  setOpen(false)
                }}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
