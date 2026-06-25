"use client"

import { useState } from "react"
import { GripVertical, Inbox, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

const TIER_CHECKBOX: Record<Task["tier"], string> = {
  focus: "border-tier-focus",
  important: "border-tier-important",
  immediate: "border-tier-immediate",
  other: "border-tier-other",
}

interface TaskCardProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onSendToInbox?: (id: string, title: string) => void
}

export function TaskCard({ task, onUpdate, onDelete, onSendToInbox }: TaskCardProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? "")

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setTitle(task.title)
      setNotes(task.notes ?? "")
    }
    if (!isOpen) {
      const trimmed = title.trim()
      if (!trimmed) {
        onDelete(task.id)
      } else {
        const updates: Partial<Task> = {}
        if (trimmed !== task.title) updates.title = trimmed
        if ((notes || null) !== task.notes) updates.notes = notes || null
        if (Object.keys(updates).length > 0) onUpdate(task.id, updates)
      }
    }
    setOpen(isOpen)
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("application/task-id", task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const hasTime = task.time_start && task.time_end

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group flex cursor-grab items-start gap-1.5 px-1.5 py-2.5 active:cursor-grabbing",
        task.completed && "opacity-50"
      )}
    >
      <GripVertical className="mt-px size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />

      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) =>
          onUpdate(task.id, { completed: checked === true })
        }
        className={cn(
          "mt-px shrink-0",
          TIER_CHECKBOX[task.tier],
          "data-checked:border-completed data-checked:bg-completed"
        )}
      />

      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex-1 text-left text-sm break-words min-w-0",
                task.completed && "line-through text-muted-foreground",
                !task.title && "text-muted-foreground"
              )}
            >
              {task.title || "New task..."}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleOpenChange(false)
                }
              }}
              placeholder="Task title"
              autoFocus
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="min-h-10 text-xs"
            />
            {onSendToInbox && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSendToInbox(task.id, task.title)
                  setOpen(false)
                }}
                className="w-full justify-start text-muted-foreground"
              >
                <Inbox className="mr-1.5 size-3.5" />
                Send to Inbox
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDelete(task.id)
                setOpen(false)
              }}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Delete task
            </Button>
          </PopoverContent>
        </Popover>

        {hasTime && (
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {task.time_start!.slice(0, 5)}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onSendToInbox && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSendToInbox(task.id, task.title)}
            className="size-5"
          >
            <Inbox className="size-3 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="size-5"
        >
          <Trash2 className="size-3 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
