"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { MonthlyGoal } from "@/lib/types"

export function useMonthlyGoals(year: number, month: number) {
  const demo = useDemoContext()
  const [goals, setGoals] = useState<MonthlyGoal[]>([])
  const [loading, setLoading] = useState(!demo)

  useEffect(() => {
    if (demo) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("monthly_goals")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch goals:", error)
        setGoals((data as MonthlyGoal[]) ?? [])
        setLoading(false)
      })
  }, [year, month, demo])

  const activeGoals = demo
    ? demo.state.goals.filter((g) => g.year === year && g.month === month)
    : goals

  const addGoal = useCallback(
    async (title: string, targetCount: number | null) => {
      const goal: MonthlyGoal = {
        id: crypto.randomUUID(),
        year,
        month,
        title,
        target_count: targetCount,
        completed_dates: [],
        created_at: new Date().toISOString(),
      }

      if (demo) {
        demo.setGoals((prev) => [...prev, goal])
        return goal.id
      }

      setGoals((prev) => [...prev, goal])
      const supabase = createClient()
      const { error } = await supabase.from("monthly_goals").insert(goal)
      if (error) console.error("Failed to add goal:", error)
      return goal.id
    },
    [year, month, demo]
  )

  const toggleDate = useCallback(
    async (goalId: string, date: string) => {
      const updateGoals = (prev: MonthlyGoal[]) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const has = g.completed_dates.includes(date)
          const newDates = has
            ? g.completed_dates.filter((d) => d !== date)
            : [...g.completed_dates, date].sort()
          return { ...g, completed_dates: newDates }
        })

      if (demo) {
        demo.setGoals(updateGoals)
        return
      }

      let newDates: string[] = []
      setGoals((prev) => {
        const updated = updateGoals(prev)
        newDates = updated.find((g) => g.id === goalId)?.completed_dates ?? []
        return updated
      })

      const supabase = createClient()
      const { error } = await supabase
        .from("monthly_goals")
        .update({ completed_dates: newDates })
        .eq("id", goalId)
      if (error) console.error("Failed to toggle date:", error)
    },
    [demo]
  )

  const deleteGoal = useCallback(async (goalId: string) => {
    if (demo) {
      demo.setGoals((prev) => prev.filter((g) => g.id !== goalId))
      return
    }

    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    const supabase = createClient()
    const { error } = await supabase
      .from("monthly_goals")
      .delete()
      .eq("id", goalId)
    if (error) console.error("Failed to delete goal:", error)
  }, [demo])

  return { goals: activeGoals, loading, addGoal, toggleDate, deleteGoal }
}
