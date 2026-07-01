"use client"

import { useCallback, useEffect, useState } from "react"
import { getDaysInMonth, format, subMonths, startOfMonth } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { Task, MealPlan, MonthlyGoal } from "@/lib/types"

// Show recap for the previous month if we're within the first 5 days of a new month
const SHOW_WITHIN_DAYS = 5

export interface MonthRecapData {
  year: number
  month: number
  daysInMonth: number
  tasks: Task[]
  meals: MealPlan[]
  goals: MonthlyGoal[]
}

export function useMonthRecap() {
  const demo = useDemoContext()
  const [data, setData] = useState<MonthRecapData | null>(null)

  useEffect(() => {
    if (demo) return

    const today = new Date()
    if (today.getDate() > SHOW_WITHIN_DAYS) return

    const prevMonthStart = subMonths(startOfMonth(today), 1)
    const year = prevMonthStart.getFullYear()
    const month = prevMonthStart.getMonth() + 1

    const seenKey = `recap-seen-${year}-${month}`
    if (localStorage.getItem(seenKey)) return

    const daysInMonth = getDaysInMonth(prevMonthStart)
    const startDate = format(prevMonthStart, "yyyy-MM-dd")
    const endDate = format(new Date(year, month - 1, daysInMonth), "yyyy-MM-dd")

    const supabase = createClient()
    Promise.all([
      supabase.from("tasks").select("*").gte("date", startDate).lte("date", endDate),
      supabase.from("meal_plan").select("*").gte("date", startDate).lte("date", endDate),
      supabase.from("monthly_goals").select("*").eq("year", year).eq("month", month),
    ]).then(([tasksRes, mealsRes, goalsRes]) => {
      if (tasksRes.error) console.error("Recap: failed to fetch tasks", tasksRes.error)
      if (mealsRes.error) console.error("Recap: failed to fetch meals", mealsRes.error)
      if (goalsRes.error) console.error("Recap: failed to fetch goals", goalsRes.error)
      setData({
        year,
        month,
        daysInMonth,
        tasks: (tasksRes.data as Task[]) ?? [],
        meals: (mealsRes.data as MealPlan[]) ?? [],
        goals: (goalsRes.data as MonthlyGoal[]) ?? [],
      })
    })
  }, [demo])

  const dismiss = useCallback(() => {
    if (!data) return
    localStorage.setItem(`recap-seen-${data.year}-${data.month}`, "1")
    setData(null)
  }, [data])

  const carryOverGoals = useCallback(
    async (goalIds: string[]) => {
      if (!data) return
      const today = new Date()
      const newYear = today.getFullYear()
      const newMonth = today.getMonth() + 1

      const supabase = createClient()
      const { data: existing } = await supabase
        .from("monthly_goals")
        .select("title")
        .eq("year", newYear)
        .eq("month", newMonth)

      const existingTitles = new Set(((existing ?? []) as { title: string }[]).map((g) => g.title))

      const toInsert = data.goals
        .filter((g) => goalIds.includes(g.id) && !existingTitles.has(g.title))
        .map((g) => ({
          id: crypto.randomUUID(),
          year: newYear,
          month: newMonth,
          title: g.title,
          target_count: g.target_count,
          completed_dates: [],
          created_at: new Date().toISOString(),
        }))

      if (toInsert.length > 0) {
        const { error } = await supabase.from("monthly_goals").insert(toInsert)
        if (error) console.error("Failed to carry over goals:", error)
      }
    },
    [data]
  )

  return { data, dismiss, carryOverGoals }
}
