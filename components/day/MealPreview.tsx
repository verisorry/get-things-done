"use client"

import { useState } from "react"
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
import { cn } from "@/lib/utils"
import type { MealPlan, MealType } from "@/lib/types"

interface MealPreviewProps {
  lunch: MealPlan | null
  dinner: MealPlan | null
  onSave: (meal: MealType, title: string, notes: string | null) => void
}

export function MealPreview({ lunch, dinner, onSave }: MealPreviewProps) {
  return (
    <div className="flex gap-2 px-4 py-3">
      <MealChip meal="lunch" data={lunch} onSave={onSave} />
      <MealChip meal="dinner" data={dinner} onSave={onSave} />
    </div>
  )
}

function MealChip({
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
      onSave(meal, trimmed, notes.trim() || null)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        onClick={() => handleOpenChange(true)}
        className={cn(
          "flex-1 truncate rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          data
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            : "border border-dashed border-border text-muted-foreground hover:bg-secondary/50"
        )}
      >
        {data?.title ?? `+ ${label}`}
      </button>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
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
            placeholder="Ingredients, prep notes..."
            className="min-h-16 text-sm"
          />
        </div>

        <DialogFooter>
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
