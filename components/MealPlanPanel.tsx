"use client"

import { Fragment, useEffect, useRef, useState } from "react"
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
import { useToday } from "@/hooks/use-today"
import { cn } from "@/lib/utils"
import type { MealPlan, MealType, PantryCategory, PantryItem } from "@/lib/types"

type DragKey = { date: string; meal: MealType }

const PANTRY_CATEGORIES: { key: PantryCategory; label: string }[] = [
  { key: "produce", label: "Produce" },
  { key: "meat", label: "Meat & Seafood" },
  { key: "noodles", label: "Ready-made" },
  { key: "pantry", label: "Pantry" },
  { key: "other", label: "Other" },
]

export function MealPlanPanel() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dragOver, setDragOver] = useState<DragKey | null>(null)
  const dragSource = useRef<DragKey | null>(null)

  const baseStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStart = addDays(baseStart, weekOffset * 7)
  const weekEnd = addDays(weekStart, 6)
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const todayStr = useToday()

  const { getMeal, upsertMeal, deleteMeal, swapMeals } = useWeekMealPlan(weekStartStr)
  const {
    items: pantryItems,
    addItem: addPantryItem,
    toggleItem: togglePantryItem,
    reorderItem: reorderPantryItem,
    deleteItem: deletePantryItem,
  } = usePantry()

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-2.5">
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
      </div>

      <PantrySection
        items={pantryItems}
        onAdd={addPantryItem}
        onToggle={togglePantryItem}
        onReorder={reorderPantryItem}
        onDelete={deletePantryItem}
      />
    </div>
  )
}

function PantrySection({
  items,
  onAdd,
  onToggle,
  onReorder,
  onDelete,
}: {
  items: PantryItem[]
  onAdd: (title: string, category: PantryCategory) => void
  onToggle: (id: string) => void
  onReorder: (itemId: string, category: PantryCategory, beforeItemId: string | null) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-2.5">
      <span className="shrink-0 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        Pantry
      </span>

      <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 pb-2.5">
          {PANTRY_CATEGORIES.map(({ key, label }) => (
            <PantryCategorySection
              key={key}
              category={key}
              label={label}
              items={items.filter((i) => i.category === key)}
              onAdd={onAdd}
              onToggle={onToggle}
              onReorder={onReorder}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PantryCategorySection({
  category,
  label,
  items,
  onAdd,
  onToggle,
  onReorder,
  onDelete,
}: {
  category: PantryCategory
  label: string
  items: PantryItem[]
  onAdd: (title: string, category: PantryCategory) => void
  onToggle: (id: string) => void
  onReorder: (itemId: string, category: PantryCategory, beforeItemId: string | null) => void
  onDelete: (id: string) => void
}) {
  const [dropAtEnd, setDropAtEnd] = useState(false)
  const [dragOverItem, setDragOverItem] = useState<{ id: string; position: "before" | "after" } | null>(null)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = newTitle.trim()
      if (trimmed) {
        onAdd(trimmed, category)
        setNewTitle("")
      }
    } else if (e.key === "Escape") {
      setNewTitle("")
      setAdding(false)
    }
  }

  function handleAddBlur() {
    const trimmed = newTitle.trim()
    if (trimmed) onAdd(trimmed, category)
    setNewTitle("")
    setAdding(false)
  }

  function handleSectionDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("application/pantry-id")) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropAtEnd(true)
  }

  function handleSectionDragLeave(e: React.DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropAtEnd(false)
    }
  }

  function handleSectionDrop(e: React.DragEvent) {
    const draggedId = e.dataTransfer.getData("application/pantry-id")
    if (!draggedId) return
    e.preventDefault()
    setDropAtEnd(false)
    onReorder(draggedId, category, null)
  }

  function handleRowDragOver(e: React.DragEvent, item: PantryItem) {
    if (!e.dataTransfer.types.includes("application/pantry-id")) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    const rect = e.currentTarget.getBoundingClientRect()
    const position = e.clientY - rect.top < rect.height / 2 ? "before" : "after"
    setDragOverItem({ id: item.id, position })
  }

  function handleRowDragLeave(e: React.DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  function handleRowDrop(e: React.DragEvent, item: PantryItem) {
    const draggedId = e.dataTransfer.getData("application/pantry-id")
    if (!draggedId) return
    e.preventDefault()
    e.stopPropagation()
    if (draggedId === item.id) {
      setDragOverItem(null)
      return
    }

    const position = dragOverItem?.id === item.id ? dragOverItem.position : "before"
    const idx = items.findIndex((i) => i.id === item.id)
    const beforeId = position === "before" ? item.id : (items[idx + 1]?.id ?? null)
    onReorder(draggedId, category, beforeId)
    setDragOverItem(null)
  }

  return (
    <div
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
      onDrop={handleSectionDrop}
      className={cn("group/section rounded", dropAtEnd && "ring-1 ring-[#007aff]/40")}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium text-muted-foreground/70">
          {label}
        </span>
        <button
          onClick={() => {
            setNewTitle("")
            setAdding(true)
          }}
          className="opacity-0 transition-opacity group-hover/section:opacity-100 focus:opacity-100"
        >
          <Plus className="size-3 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-0.5 flex min-h-[20px] flex-col gap-0.5">
        {items.length === 0 && !adding && (
          <span className="px-1 py-0.5 text-[10px] text-muted-foreground/30">
            No items
          </span>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/pantry-id", item.id)
              e.dataTransfer.effectAllowed = "move"
            }}
            onDragOver={(e) => handleRowDragOver(e, item)}
            onDragLeave={handleRowDragLeave}
            onDrop={(e) => handleRowDrop(e, item)}
            className={cn(
              "group flex cursor-grab items-center gap-1.5 rounded border-t-2 border-b-2 border-transparent px-1 py-0.5 hover:bg-secondary/50 active:cursor-grabbing",
              dragOverItem?.id === item.id && dragOverItem.position === "before" && "border-t-[#007aff]",
              dragOverItem?.id === item.id && dragOverItem.position === "after" && "border-b-[#007aff]"
            )}
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
        {adding && (
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <div className="size-3.5 shrink-0 rounded-full border border-border" />
            <input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              onBlur={handleAddBlur}
              className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
              placeholder="Add ingredient..."
            />
          </div>
        )}
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
