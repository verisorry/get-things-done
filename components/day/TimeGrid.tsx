"use client"

import { useCallback, useEffect, useRef, useState } from "react"

function setCursor(cursor: string) {
  document.body.style.cursor = cursor
}
import { cn } from "@/lib/utils"
import type { Task, TaskTier } from "@/lib/types"

export const START_HOUR = 0
export const END_HOUR = 24
const SLOT_HEIGHT = 28
const DEFAULT_DURATION_SLOTS = 2

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
)

const TOTAL_SLOTS = HOURS.length * 2

const TIER_BLOCK: Record<TaskTier, string> = {
  focus: "bg-tier-focus-block text-white",
  important: "bg-tier-important-block",
  immediate: "bg-tier-immediate-block",
  other: "bg-tier-other-block",
}

function formatHour(hour: number) {
  if (hour === 0) return "12 AM"
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return "12 PM"
  return `${hour - 12} PM`
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${hour}:00` : `${hour}:${String(m).padStart(2, "0")}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function slotToTime(slot: number): string {
  const mins = START_HOUR * 60 + slot * 30
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

interface TimeGridProps {
  tasks: Task[]
  isToday: boolean
  onDropTask: (taskId: string, timeStart: string, timeEnd: string) => void
  onDropGoal?: (goalId: string, goalTitle: string, timeStart: string, timeEnd: string) => void
  onDropMeal?: (mealTitle: string, timeStart: string, timeEnd: string, mealType: string) => void
}

export function TimeGrid({
  tasks,
  isToday,
  onDropTask,
  onDropGoal,
  onDropMeal,
}: TimeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 9 * 2 * SLOT_HEIGHT
    }
  }, [])
  const [dragSlot, setDragSlot] = useState<number | null>(null)

  const [resizing, setResizing] = useState<{
    taskId: string
    startSlot: number
    endSlot: number
  } | null>(null)

  const [moving, setMoving] = useState<{
    taskId: string
    startSlot: number
    duration: number
  } | null>(null)

  const resizeRef = useRef<{ taskId: string; startSlot: number } | null>(null)
  const resizeEndRef = useRef(0)
  const moveRef = useRef<{
    taskId: string
    duration: number
    offsetSlots: number
  } | null>(null)
  const moveSlotRef = useRef(0)

  const gridHeight = HOURS.length * SLOT_HEIGHT * 2

  const timeBlocked = tasks.filter((t) => t.time_start && t.time_end)

  const getSlotFromEvent = useCallback((e: React.DragEvent) => {
    const el = gridRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const y = e.clientY - rect.top
    const slot = Math.floor(y / SLOT_HEIGHT)
    return Math.max(0, Math.min(slot, TOTAL_SLOTS - DEFAULT_DURATION_SLOTS))
  }, [])

  function handleDragOver(e: React.DragEvent) {
    const { types } = e.dataTransfer
    if (
      !types.includes("application/task-id") &&
      !types.includes("application/goal-id") &&
      !types.includes("application/meal-type")
    ) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragSlot(getSlotFromEvent(e))
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setDragSlot(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const slot = getSlotFromEvent(e)
    if (slot === null) { setDragSlot(null); return }
    const timeStart = slotToTime(slot)
    const timeEnd = slotToTime(slot + DEFAULT_DURATION_SLOTS)

    const taskId = e.dataTransfer.getData("application/task-id")
    if (taskId) {
      onDropTask(taskId, timeStart, timeEnd)
      setDragSlot(null)
      return
    }

    const goalId = e.dataTransfer.getData("application/goal-id")
    const goalTitle = e.dataTransfer.getData("application/goal-title")
    if (goalId && goalTitle) {
      onDropGoal?.(goalId, goalTitle, timeStart, timeEnd)
      setDragSlot(null)
      return
    }

    const mealTitle = e.dataTransfer.getData("application/meal-title")
    const mealType = e.dataTransfer.getData("application/meal-type")
    if (mealTitle && mealType) {
      onDropMeal?.(mealTitle, timeStart, timeEnd, mealType)
      setDragSlot(null)
      return
    }

    setDragSlot(null)
  }

  function handleResizeStart(
    taskId: string,
    startSlot: number,
    currentEndSlot: number,
    e: React.MouseEvent
  ) {
    e.preventDefault()
    e.stopPropagation()

    resizeRef.current = { taskId, startSlot }
    resizeEndRef.current = currentEndSlot
    setResizing({ taskId, startSlot, endSlot: currentEndSlot })

    function onMouseMove(ev: MouseEvent) {
      const grid = gridRef.current
      if (!grid || !resizeRef.current) return
      const rect = grid.getBoundingClientRect()
      const y = ev.clientY - rect.top
      const slot = Math.ceil(y / SLOT_HEIGHT)
      const endSlot = Math.max(
        resizeRef.current.startSlot + 1,
        Math.min(slot, TOTAL_SLOTS)
      )
      resizeEndRef.current = endSlot
      setResizing({
        taskId: resizeRef.current.taskId,
        startSlot: resizeRef.current.startSlot,
        endSlot,
      })
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      setCursor("")
      if (resizeRef.current) {
        onDropTask(
          resizeRef.current.taskId,
          slotToTime(resizeRef.current.startSlot),
          slotToTime(resizeEndRef.current)
        )
      }
      resizeRef.current = null
      setResizing(null)
    }

    setCursor("ns-resize")
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  function handleMoveStart(
    taskId: string,
    startSlot: number,
    duration: number,
    e: React.MouseEvent
  ) {
    e.preventDefault()

    const grid = gridRef.current
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    const y = e.clientY - rect.top
    const clickedSlot = Math.floor(y / SLOT_HEIGHT)
    const offsetSlots = clickedSlot - startSlot

    moveRef.current = { taskId, duration, offsetSlots }
    moveSlotRef.current = startSlot
    setMoving({ taskId, startSlot, duration })

    function onMouseMove(ev: MouseEvent) {
      const g = gridRef.current
      if (!g || !moveRef.current) return
      const r = g.getBoundingClientRect()
      const my = ev.clientY - r.top
      const rawSlot = Math.floor(my / SLOT_HEIGHT) - moveRef.current.offsetSlots
      const clamped = Math.max(
        0,
        Math.min(rawSlot, TOTAL_SLOTS - moveRef.current.duration)
      )
      moveSlotRef.current = clamped
      setMoving({
        taskId: moveRef.current.taskId,
        startSlot: clamped,
        duration: moveRef.current.duration,
      })
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      setCursor("")
      if (moveRef.current) {
        const s = moveSlotRef.current
        onDropTask(
          moveRef.current.taskId,
          slotToTime(s),
          slotToTime(s + moveRef.current.duration)
        )
      }
      moveRef.current = null
      setMoving(null)
    }

    setCursor("grab")
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className="flex-[7] overflow-y-auto pr-2"
    >
      <div
        ref={gridRef}
        className="relative select-none"
        style={{ height: gridHeight }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {HOURS.map((hour) => {
          const top = (hour - START_HOUR) * SLOT_HEIGHT * 2
          return (
            <div key={hour} className="absolute inset-x-0" style={{ top }}>
              <div className="flex h-7 items-start">
                <span className="w-14 shrink-0 pr-2 text-right font-mono text-[10px] leading-none text-muted-foreground">
                  {formatHour(hour)}
                </span>
                <div className="flex-1 border-t border-black/[0.05] dark:border-white/[0.06]" />
              </div>
              <div className="flex h-7 items-start">
                <span className="w-14 shrink-0" />
                <div className="flex-1 border-t border-dashed border-black/[0.03] dark:border-white/[0.03]" />
              </div>
            </div>
          )
        })}

        {timeBlocked.map((task) => {
          const startMins = timeToMinutes(task.time_start!)
          const endMins = timeToMinutes(task.time_end!)
          const startSlot = (startMins - START_HOUR * 60) / 30
          const endSlot = (endMins - START_HOUR * 60) / 30
          const duration = endSlot - startSlot

          const isResizingThis = resizing?.taskId === task.id
          const isMovingThis = moving?.taskId === task.id

          const displayTop = isMovingThis
            ? moving.startSlot * SLOT_HEIGHT
            : startSlot * SLOT_HEIGHT
          const displayHeight = isResizingThis
            ? (resizing.endSlot - resizing.startSlot) * SLOT_HEIGHT
            : duration * SLOT_HEIGHT

          return (
            <div
              key={task.id}
              onMouseDown={(e) =>
                handleMoveStart(task.id, startSlot, duration, e)
              }
              className={cn(
                "group/block absolute right-1 left-14 z-20 cursor-grab overflow-hidden rounded-lg px-2 py-1 active:cursor-grabbing",
                TIER_BLOCK[task.tier],
                task.completed && "opacity-40",
                (isMovingThis || isResizingThis) && "z-30 ring-2 ring-ring/30"
              )}
              style={{
                top: Math.max(displayTop, 0),
                height: Math.max(displayHeight, SLOT_HEIGHT),
              }}
            >
              {duration <= 1 ? (
                <div className="flex items-baseline gap-1.5 overflow-hidden">
                  <span className="truncate text-[11px] font-semibold leading-none">{task.title}</span>
                  <span className="shrink-0 text-[9px] leading-none text-muted-foreground">{formatTime(task.time_start!)}</span>
                </div>
              ) : (
                <>
                  <span className="block text-[11px] font-semibold leading-tight">{task.title}</span>
                  <span className="block text-[9px] text-muted-foreground">{formatTime(task.time_start!)}</span>
                </>
              )}

              <div
                onMouseDown={(e) =>
                  handleResizeStart(task.id, startSlot, endSlot, e)
                }
                className="absolute right-0 bottom-0 left-0 flex h-2.5 cursor-ns-resize items-center justify-center opacity-0 transition-opacity group-hover/block:opacity-100"
              >
                <div className="h-[2px] w-6 rounded-full bg-foreground/30" />
              </div>
            </div>
          )
        })}

        {dragSlot !== null && (
          <div
            className="pointer-events-none absolute right-1 left-14 z-30 rounded-lg border-2 border-dashed border-ring/40 bg-ring/10"
            style={{
              top: dragSlot * SLOT_HEIGHT,
              height: DEFAULT_DURATION_SLOTS * SLOT_HEIGHT,
            }}
          />
        )}

        {isToday && <CurrentTimeLine />}
      </div>
    </div>
  )
}

function CurrentTimeLine() {
  const [top, setTop] = useState<number | null>(null)

  useEffect(() => {
    function calc() {
      const now = new Date()
      const mins = now.getHours() * 60 + now.getMinutes()
      const start = START_HOUR * 60
      const end = END_HOUR * 60
      if (mins < start || mins > end) return setTop(null)
      setTop(((mins - start) / 30) * SLOT_HEIGHT)
    }
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [])

  if (top === null) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
      style={{ top }}
    >
      <div className="ml-[52px] size-2 rounded-full bg-[#ff3b30]" />
      <div className="h-px flex-1 bg-[#ff3b30]" />
    </div>
  )
}
