"use client"

import { format, getMonth, getYear, parseISO } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { TaskList } from "@/components/day/TaskList"
import { TimeGrid } from "@/components/day/TimeGrid"
import { MealPreview } from "@/components/day/MealPreview"
import { useDay } from "@/hooks/use-day"
import { useMealPlan } from "@/hooks/use-meal-plan"
import { useMonthlyGoals } from "@/hooks/use-monthly-goals"
import { useToday } from "@/hooks/use-today"
import { useDaySettings } from "@/lib/settings-context"
import { cn } from "@/lib/utils"

interface DayPanelProps {
  date: string
  isToday: boolean
  ref?: React.Ref<HTMLDivElement>
}

export function DayPanel({
  date,
  isToday,
  ref,
}: DayPanelProps) {
  const { tasks, addTask, updateTask, deleteTask, upsertTimedBlock, reorderTask } = useDay(date)
  const { lunch, dinner, upsertMeal } = useMealPlan(date)
  const parsed = parseISO(date)
  const { goals, toggleDate } = useMonthlyGoals(getYear(parsed), getMonth(parsed) + 1)
  const { settings } = useDaySettings()
  const today = useToday()

  const isPastDay = date < today
  const regularTasks = tasks.filter((t) => !t.source)
  const completedGoals = goals.filter((g) => g.completed_dates.includes(date)).length
  const total = regularTasks.length + goals.length
  const completed = regularTasks.filter((t) => t.completed).length + completedGoals
  const progress = total > 0 ? completed / total : 0

  return (
    <div
      ref={ref}
      data-date={date}
      className="flex h-full w-[85%] min-w-[380px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-white shadow-card dark:border dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none"
    >
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-1">
        <span className="text-[22px] font-bold">
          {format(parsed, "EEEE")}
        </span>
        <span
          className={cn(
            "rounded-[20px] px-2.5 py-0.5 text-xs font-semibold",
            isToday
              ? "bg-[#1c1c1e] text-white dark:bg-white dark:text-[#1c1c1e]"
              : "text-muted-foreground"
          )}
        >
          {format(parsed, "MMM d")}
        </span>
      </div>

      {total > 0 && (
        <div className="mx-4 mt-1.5 mb-1 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-completed transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-3 flex-col">
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <TaskList
              tasks={tasks}
              date={date}
              goals={goals}
              lunch={lunch}
              dinner={dinner}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onReorderTask={reorderTask}
              onToggleGoal={(goalId) => toggleDate(goalId, date)}
              onSendToInbox={(id, title) => {
                if (!isPastDay) {
                  deleteTask(id)
                }
                window.dispatchEvent(
                  new CustomEvent("task-to-inbox", { detail: { title } })
                )
              }}
              isPastDay={isPastDay}
              onSaveMeal={upsertMeal}
            />
          </div>

          <Separator />

          <MealPreview lunch={lunch} dinner={dinner} onSave={upsertMeal} />
        </div>

        <Separator orientation="vertical" />

        <TimeGrid
          tasks={tasks}
          isToday={isToday}
          date={date}
          goals={goals}
          startHour={settings.dayStartHour}
          endHour={settings.dayEndHour}
          onDropTask={(taskId, timeStart, timeEnd) =>
            updateTask(taskId, { time_start: timeStart, time_end: timeEnd })
          }
          onUnscheduleTask={(taskId) =>
            updateTask(taskId, { time_start: null, time_end: null })
          }
          onDropGoal={(goalId, goalTitle, timeStart, timeEnd) =>
            upsertTimedBlock(`goal:${goalId}`, goalTitle, "important", timeStart, timeEnd)
          }
          onDropMeal={(mealTitle, timeStart, timeEnd, mealType) =>
            upsertTimedBlock(`meal:${mealType}`, mealTitle, "other", timeStart, timeEnd)
          }
        />
      </div>
    </div>
  )
}
