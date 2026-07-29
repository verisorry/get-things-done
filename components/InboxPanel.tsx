"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { addDays, format, parseISO } from "date-fns"
import { AnimatePresence, motion } from "motion/react"
import { CalendarDays, PanelLeftClose, Inbox as InboxIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useInbox } from "@/hooks/use-inbox"
import { useToday } from "@/hooks/use-today"
import { cn } from "@/lib/utils"
import type { InboxItem } from "@/lib/types"

const MIN_WIDTH = 220
const MAX_WIDTH = 500
const DEFAULT_WIDTH = 320
const RAIL_WIDTH = 48
const STORAGE_KEY_COLLAPSED = "inbox-collapsed"

function parseInput(value: string): { title: string; tag: string | null } {
  const match = value.match(/@(\S+)/)
  if (!match) return { title: value.trim(), tag: null }
  const tag = match[1].toLowerCase()
  const title = value.replace(match[0], "").trim()
  return { title: title || tag, tag }
}

export function InboxPanel() {
  const { items, addItem, delegateItem, deleteItem, markDelegated, reorderItem } = useInbox()

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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) === "1"
  })
  const [ready, setReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => setReady(true))
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY_COLLAPSED, next ? "1" : "0")
      return next
    })
  }

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

    const byPosition = (a: InboxItem, b: InboxItem) => a.position - b.position
    untagged.sort(byPosition)
    for (const list of tagMap.values()) list.sort(byPosition)

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

  if (collapsed) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 flex-col items-center overflow-hidden rounded-[20px] border border-white/80 bg-white/60 pt-3 shadow-none backdrop-blur-[20px] dark:border-white/[0.06] dark:bg-white/[0.03]",
          ready && "transition-[width] duration-200 ease-in-out"
        )}
        style={{ width: RAIL_WIDTH }}
      >
        <button
          onClick={toggleCollapsed}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Expand inbox"
        >
          <InboxIcon className="size-[18px]" />
        </button>
        {items.length > 0 && (
          <Badge variant="secondary" className="mt-2 text-[10px]">
            {items.length}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/60 shadow-none backdrop-blur-[20px] dark:border-white/[0.06] dark:bg-white/[0.03]",
        ready && "transition-[width] duration-200 ease-in-out"
      )}
      style={{ width }}
    >
      <div className="flex h-11 shrink-0 items-center gap-2 px-4">
        <span className="text-sm font-semibold">Inbox</span>
        {items.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {items.length}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="ml-auto size-6 text-muted-foreground hover:text-foreground"
          aria-label="Collapse inbox"
        >
          <PanelLeftClose className="size-3.5" />
        </Button>
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
                tag={null}
                items={grouped.untagged}
                onDelegate={delegateItem}
                onDelete={deleteItem}
                onReorder={reorderItem}
              />
            )}
            {grouped.tags.map(([tag, tagItems]) => (
              <InboxSection
                key={tag}
                label={tag}
                tag={tag}
                items={tagItems}
                onDelegate={delegateItem}
                onDelete={deleteItem}
                onReorder={reorderItem}
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
  tag,
  items,
  onDelegate,
  onDelete,
  onReorder,
}: {
  label: string
  tag: string | null
  items: InboxItem[]
  onDelegate: (id: string, date: string) => void
  onDelete: (id: string) => void
  onReorder: (itemId: string, tag: string | null, beforeItemId: string | null) => void
}) {
  const [dropAtEnd, setDropAtEnd] = useState(false)
  const [dragOverItem, setDragOverItem] = useState<{ id: string; position: "before" | "after" } | null>(null)

  function handleSectionDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("application/inbox-id")) return
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
    const draggedId = e.dataTransfer.getData("application/inbox-id")
    if (!draggedId) return
    e.preventDefault()
    setDropAtEnd(false)
    onReorder(draggedId, tag, null)
  }

  function handleRowDragOver(e: React.DragEvent, item: InboxItem) {
    if (!e.dataTransfer.types.includes("application/inbox-id")) return
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

  function handleRowDrop(e: React.DragEvent, item: InboxItem) {
    const draggedId = e.dataTransfer.getData("application/inbox-id")
    if (!draggedId) return
    e.preventDefault()
    e.stopPropagation()
    if (draggedId === item.id) { setDragOverItem(null); return }

    const position = dragOverItem?.id === item.id ? dragOverItem.position : "before"
    const idx = items.findIndex((i) => i.id === item.id)
    const beforeId = position === "before" ? item.id : (items[idx + 1]?.id ?? null)
    onReorder(draggedId, tag, beforeId)
    setDragOverItem(null)
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[16px] bg-card shadow-card dark:border dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none",
        dropAtEnd && "ring-1 ring-ring/30"
      )}
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
      onDrop={handleSectionDrop}
    >
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
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              onDelegate={onDelegate}
              onDelete={onDelete}
              dropIndicator={dragOverItem?.id === item.id ? dragOverItem.position : null}
              onRowDragOver={(e) => handleRowDragOver(e, item)}
              onRowDragLeave={handleRowDragLeave}
              onRowDrop={(e) => handleRowDrop(e, item)}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}

function InboxRow({
  item,
  onDelegate,
  onDelete,
  dropIndicator,
  onRowDragOver,
  onRowDragLeave,
  onRowDrop,
}: {
  item: InboxItem
  onDelegate: (id: string, date: string) => void
  onDelete: (id: string) => void
  dropIndicator?: "before" | "after" | null
  onRowDragOver: (e: React.DragEvent) => void
  onRowDragLeave: (e: React.DragEvent) => void
  onRowDrop: (e: React.DragEvent) => void
}) {
  const [open, setOpen] = useState(false)
  const today = useToday()
  const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd")

  function delegate(date: string) {
    onDelegate(item.id, date)
    setOpen(false)
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      draggable
      // motion.div reserves onDragStart for its own pan-gesture API; the
      // capture-phase variant is untouched and behaves the same here.
      onDragStartCapture={(e) => {
        e.dataTransfer.setData("application/inbox-id", item.id)
        e.dataTransfer.setData("application/inbox-title", item.title)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={onRowDragOver}
      onDragLeave={onRowDragLeave}
      onDrop={onRowDrop}
      className={cn(
        "group flex cursor-grab items-start gap-2 rounded-lg border-t-2 border-b-2 border-transparent px-2 py-2 hover:bg-secondary/50 active:cursor-grabbing",
        dropIndicator === "before" && "border-t-ring",
        dropIndicator === "after" && "border-b-ring"
      )}
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
    </motion.div>
  )
}
