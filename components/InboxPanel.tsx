"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { format, addDays } from "date-fns"
import { CalendarDays, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useInbox } from "@/hooks/use-inbox"
import type { InboxItem } from "@/lib/types"

const MIN_WIDTH = 220
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 320

function parseInput(value: string): { title: string; tag: string | null } {
  const match = value.match(/@(\S+)/)
  if (!match) return { title: value.trim(), tag: null }
  const tag = match[1]
  const title = value.replace(match[0], "").trim()
  return { title: title || tag, tag }
}

export function InboxPanel() {
  const { items, addItem, delegateItem, deleteItem, markDelegated } = useInbox()

  useEffect(() => {
    function handleDelegated(e: Event) {
      const { id, date } = (e as CustomEvent).detail
      markDelegated(id, date)
    }
    function handleReturn(e: Event) {
      const { title } = (e as CustomEvent).detail
      addItem(title, null)
    }
    window.addEventListener("inbox-delegated", handleDelegated)
    window.addEventListener("task-to-inbox", handleReturn)
    return () => {
      window.removeEventListener("inbox-delegated", handleDelegated)
      window.removeEventListener("task-to-inbox", handleReturn)
    }
  }, [markDelegated, addItem])
  const [inputValue, setInputValue] = useState("")
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const inputRef = useRef<HTMLInputElement>(null)

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

    const tags = Array.from(tagMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )
    return { untagged, tags }
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

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      setWidth(Math.max(MIN_WIDTH, Math.min(startWidth + delta, MAX_WIDTH)))
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = ""
    }

    document.body.style.cursor = "col-resize"
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div
      className="relative flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/60 shadow-none backdrop-blur-[20px] dark:border-white/[0.06] dark:bg-white/[0.03]"
      style={{ width }}
    >
      <div className="flex h-11 shrink-0 items-center gap-2 px-4">
        <span className="text-sm font-semibold">Inbox</span>
        {items.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {items.length}
          </Badge>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4">
            <p className="text-sm font-medium text-muted-foreground">
              All clear!
            </p>
            <p className="text-center text-xs text-muted-foreground/60">
              Add something below or drag it here later
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.untagged.length > 0 && (
              <InboxSection
                label="Inbox"
                items={grouped.untagged}
                onDelegate={delegateItem}
                onDelete={deleteItem}
              />
            )}
            {grouped.tags.map(([tag, tagItems]) => (
              <InboxSection
                key={tag}
                label={tag}
                items={tagItems}
                onDelegate={delegateItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3">
        <div className="flex items-center gap-2.5 rounded-[12px] bg-card px-3 py-2.5 shadow-card dark:border dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none">
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

      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-ring/20 active:bg-ring/30"
      />
    </div>
  )
}

function InboxSection({
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
    <section className="overflow-hidden rounded-[16px] bg-card shadow-card dark:border dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground/50 shadow-[0_0_6px_rgba(120,113,108,0.3)]" />
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground">
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </span>
        <Badge variant="secondary" className="ml-auto text-[9px]">
          {items.length}
        </Badge>
      </div>
      <div className="flex flex-col px-2 pb-2">
        {items.map((item) => (
          <InboxRow
            key={item.id}
            item={item}
            onDelegate={onDelegate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
}

function InboxRow({
  item,
  onDelegate,
  onDelete,
}: {
  item: InboxItem
  onDelegate: (id: string, date: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const today = format(new Date(), "yyyy-MM-dd")
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")

  function delegate(date: string) {
    onDelegate(item.id, date)
    setOpen(false)
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/inbox-id", item.id)
        e.dataTransfer.setData("application/inbox-title", item.title)
        e.dataTransfer.effectAllowed = "move"
      }}
      className="group flex cursor-grab items-start gap-2 rounded-lg px-2 py-2 hover:bg-secondary/50 active:cursor-grabbing"
    >
      <span className="flex-1 break-words text-sm">{item.title}</span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6">
              <CalendarDays className="size-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 gap-1 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => delegate(today)}
              className="w-full justify-start text-xs"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => delegate(tomorrow)}
              className="w-full justify-start text-xs"
            >
              Tomorrow
            </Button>
            <Separator className="my-1" />
            <input
              type="date"
              onChange={(e) => {
                if (e.target.value) delegate(e.target.value)
              }}
              className="w-full rounded-md bg-secondary px-2 py-1.5 text-xs outline-none"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="size-6"
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
