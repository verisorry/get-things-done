"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MonthlyGoal } from "@/lib/types"

export function useMonthlyGoals(year: number, month: number) {
  const [goals, setGoals] = useState<MonthlyGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [year, month])

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
      setGoals((prev) => [...prev, goal])

      const supabase = createClient()
      const { error } = await supabase.from("monthly_goals").insert(goal)
      if (error) console.error("Failed to add goal:", error)
      return goal.id
    },
    [year, month]
  )

  const toggleDate = useCallback(
    async (goalId: string, date: string) => {
      let newDates: string[] = []

      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const has = g.completed_dates.includes(date)
          newDates = has
            ? g.completed_dates.filter((d) => d !== date)
            : [...g.completed_dates, date].sort()
          return { ...g, completed_dates: newDates }
        })
      )

      const supabase = createClient()
      const { error } = await supabase
        .from("monthly_goals")
        .update({ completed_dates: newDates })
        .eq("id", goalId)
      if (error) console.error("Failed to toggle date:", error)
    },
    []
  )

  const deleteGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))

    const supabase = createClient()
    const { error } = await supabase
      .from("monthly_goals")
      .delete()
      .eq("id", goalId)
    if (error) console.error("Failed to delete goal:", error)
  }, [])

  return { goals, loading, addGoal, toggleDate, deleteGoal }
}
