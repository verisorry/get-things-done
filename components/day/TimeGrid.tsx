"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

function setCursor(cursor: string) {
  document.body.style.cursor = cursor
}
import { cn } from "@/lib/utils"
import type { MonthlyGoal, Task, TaskTier } from "@/lib/types"

const SLOT_HEIGHT = 28
const DEFAULT_DURATION_SLOTS = 2

const TIER_BLOCK: Record<TaskTier, string> = {
  focus: "bg-tier-focus-block text-white",
  important: "bg-tier-important-block",
  immediate: "bg-tier-immediate-block",
  other: "bg-tier-other-block",
}

function formatHour(hour: number) {
  const h = ((hour % 24) + 24) % 24
  if (h === 0) return "12 AM"
  if (h < 12) return `${h} AM`
  if (h === 12) return "12 PM"
  return `${h - 12} PM`
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

// Minutes elapsed since the day's start hour, wrapping times before it into the next 24h span.
function minutesFromDayStart(mins: number, startHour: number): number {
  return (((mins - startHour * 60) % 1440) + 1440) % 1440
}

function slotToTime(slot: number, startHour: number): string {
  const mins = (startHour * 60 + slot * 30) % 1440
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

// Assigns each overlapping block a column index and the total column count of
// its overlap cluster, so simultaneous blocks render side by side instead of
// stacking on top of one another (same approach calendar day views use).
function computeBlockColumns(
  blocks: { id: string; start: number; end: number }[]
): Record<string, { col: number; cols: number }> {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || a.end - b.end)

  const assignment: Record<string, number> = {}
  const clusterOf: Record<string, number> = {}
  const clusterMaxCols: Record<number, number> = {}

  let columnEnds: number[] = []
  let clusterEnd = -Infinity
  let clusterId = -1

  for (const block of sorted) {
    if (block.start >= clusterEnd) {
      columnEnds = []
      clusterEnd = -Infinity
      clusterId++
    }

    let colIndex = columnEnds.findIndex((end) => block.start >= end)
    if (colIndex === -1) {
      colIndex = columnEnds.length
      columnEnds.push(block.end)
    } else {
      columnEnds[colIndex] = block.end
    }

    assignment[block.id] = colIndex
    clusterOf[block.id] = clusterId
    clusterEnd = Math.max(clusterEnd, block.end)
    clusterMaxCols[clusterId] = Math.max(clusterMaxCols[clusterId] ?? 0, colIndex + 1)
  }

  const result: Record<string, { col: number; cols: number }> = {}
  for (const id of Object.keys(assignment)) {
    result[id] = { col: assignment[id], cols: clusterMaxCols[clusterOf[id]] }
  }
  return result
}

const BLOCK_GAP = 3

function getBlockRect(col: number, cols: number): React.CSSProperties {
  if (cols <= 1) {
    return { left: "3.5rem", right: "0.25rem" }
  }
  const totalGap = BLOCK_GAP * (cols - 1)
  const width = `calc((100% - 3.5rem - 0.25rem - ${totalGap}px) / ${cols})`
  const left = `calc(3.5rem + (${width} + ${BLOCK_GAP}px) * ${col})`
  return { left, width }
}

interface TimeGridProps {
  tasks: Task[]
  isToday: boolean
  date: string
  goals?: MonthlyGoal[]
  startHour?: number
  endHour?: number
  onDropTask: (taskId: string, timeStart: string, timeEnd: string) => void
  onDropGoal?: (goalId: string, goalTitle: string, timeStart: string, timeEnd: string) => void
  onDropMeal?: (mealTitle: string, timeStart: string, timeEnd: string, mealType: string) => void
  onUnscheduleTask?: (taskId: string) => void
  // Moving/resizing a block already on the grid always repositions that exact
  // row. Distinct from onDropTask, which (for tasks) adds a new block instead
  // of moving one, so a task can be split across multiple slots.
  onMoveBlock?: (blockId: string, timeStart: string, timeEnd: string) => void
}

export function TimeGrid({
  tasks,
  isToday,
  date,
  goals = [],
  startHour: START_HOUR = 0,
  endHour: END_HOUR = 24,
  onDropTask,
  onDropGoal,
  onDropMeal,
  onUnscheduleTask,
  onMoveBlock,
}: TimeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const HOURS = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  )

  const TOTAL_SLOTS = HOURS.length * 2

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (isToday) {
      const now = new Date()
      const mins = now.getHours() * 60 + now.getMinutes()
      const relative = minutesFromDayStart(mins, START_HOUR)
      const nowOffset = (relative / 30) * SLOT_HEIGHT
      container.scrollTop = Math.max(0, nowOffset - container.clientHeight / 2)
    } else {
      container.scrollTop = 9 * 2 * SLOT_HEIGHT
    }
  }, [isToday, START_HOUR])
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

  const blockColumns = computeBlockColumns(
    timeBlocked.map((task) => {
      const startMins = timeToMinutes(task.time_start!)
      const endMins = timeToMinutes(task.time_end!)
      const startSlot = minutesFromDayStart(startMins, START_HOUR) / 30
      const endSlot = minutesFromDayStart(endMins, START_HOUR) / 30

      const isResizingThis = resizing?.taskId === task.id
      const isMovingThis = moving?.taskId === task.id
      const duration = endSlot - startSlot

      const start = isMovingThis ? moving.startSlot : startSlot
      const end = isResizingThis
        ? resizing.endSlot
        : isMovingThis
          ? moving.startSlot + duration
          : endSlot

      return { id: task.id, start, end }
    })
  )

  function isBlockCompleted(task: Task) {
    if (task.completed) return true
    if (task.source?.startsWith("goal:")) {
      const goalId = task.source.slice("goal:".length)
      return goals.some((g) => g.id === goalId && g.completed_dates.includes(date))
    }
    if (task.source?.startsWith("task:")) {
      const parentId = task.source.slice("task:".length)
      return tasks.find((t) => t.id === parentId)?.completed ?? false
    }
    return false
  }

  const getSlotFromEvent = useCallback((e: React.DragEvent) => {
    const el = gridRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const y = e.clientY - rect.top
    const slot = Math.floor(y / SLOT_HEIGHT)
    return Math.max(0, Math.min(slot, TOTAL_SLOTS - DEFAULT_DURATION_SLOTS))
  }, [TOTAL_SLOTS])

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
    const timeStart = slotToTime(slot, START_HOUR)
    const timeEnd = slotToTime(slot + DEFAULT_DURATION_SLOTS, START_HOUR)

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
        const moveBlock = onMoveBlock ?? onDropTask
        moveBlock(
          resizeRef.current.taskId,
          slotToTime(resizeRef.current.startSlot, START_HOUR),
          slotToTime(resizeEndRef.current, START_HOUR)
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
        const moveBlock = onMoveBlock ?? onDropTask
        moveBlock(
          moveRef.current.taskId,
          slotToTime(s, START_HOUR),
          slotToTime(s + moveRef.current.duration, START_HOUR)
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
          const startSlot = minutesFromDayStart(startMins, START_HOUR) / 30
          const endSlot = minutesFromDayStart(endMins, START_HOUR) / 30
          const duration = endSlot - startSlot

          const isResizingThis = resizing?.taskId === task.id
          const isMovingThis = moving?.taskId === task.id

          const displayTop = isMovingThis
            ? moving.startSlot * SLOT_HEIGHT
            : startSlot * SLOT_HEIGHT
          const displayHeight = isResizingThis
            ? (resizing.endSlot - resizing.startSlot) * SLOT_HEIGHT
            : duration * SLOT_HEIGHT

          const { col, cols } = blockColumns[task.id] ?? { col: 0, cols: 1 }

          return (
            <div
              key={task.id}
              onMouseDown={(e) =>
                handleMoveStart(task.id, startSlot, duration, e)
              }
              className={cn(
                "group/block absolute z-20 cursor-grab overflow-hidden rounded-lg border border-black/10 px-2 py-1 active:cursor-grabbing dark:border-white/10",
                TIER_BLOCK[task.tier],
                isBlockCompleted(task) && "opacity-40",
                (isMovingThis || isResizingThis) && "z-30 ring-2 ring-ring/30"
              )}
              style={{
                top: Math.max(displayTop, 0),
                height: Math.max(displayHeight, SLOT_HEIGHT),
                ...getBlockRect(col, cols),
              }}
            >
              {onUnscheduleTask && (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUnscheduleTask(task.id)
                  }}
                  className="absolute top-1 right-1 z-10 flex size-4 items-center justify-center rounded-full bg-black/10 opacity-0 transition-opacity hover:bg-black/20 group-hover/block:opacity-100 dark:bg-white/10 dark:hover:bg-white/20"
                >
                  <X className="size-2.5" />
                </button>
              )}

              {duration <= 1 ? (
                <div className="flex items-baseline gap-1.5 overflow-hidden pr-4">
                  <span className="truncate text-[11px] font-semibold leading-none">{task.title}</span>
                  <span className="shrink-0 text-[9px] leading-none text-muted-foreground">{formatTime(task.time_start!)}</span>
                </div>
              ) : (
                <>
                  <span className="block text-[11px] font-semibold leading-tight pr-4">{task.title}</span>
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

        {isToday && <CurrentTimeLine startHour={START_HOUR} endHour={END_HOUR} />}
      </div>
    </div>
  )
}

function CurrentTimeLine({ startHour, endHour }: { startHour: number; endHour: number }) {
  const [top, setTop] = useState<number | null>(null)

  useEffect(() => {
    function calc() {
      const now = new Date()
      const mins = now.getHours() * 60 + now.getMinutes()
      const relative = minutesFromDayStart(mins, startHour)
      const span = (endHour - startHour) * 60
      if (relative > span) return setTop(null)
      setTop((relative / 30) * SLOT_HEIGHT)
    }
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [startHour, endHour])

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
