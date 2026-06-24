"use client"

import { useCallback, useEffect, useState } from "react"
import { addDays, format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import type { MealPlan, MealType } from "@/lib/types"

export function useWeekMealPlan(weekStartDate: string) {
  const [meals, setMeals] = useState<MealPlan[]>([])

  useEffect(() => {
    const endDate = format(addDays(parseISO(weekStartDate), 6), "yyyy-MM-dd")
    const supabase = createClient()
    supabase
      .from("meal_plan")
      .select("*")
      .gte("date", weekStartDate)
      .lte("date", endDate)
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch week meals:", error)
        if (data) setMeals(data as MealPlan[])
      })
  }, [weekStartDate])

  const getMeal = useCallback(
    (date: string, type: MealType): MealPlan | null => {
      return meals.find((m) => m.date === date && m.meal === type) ?? null
    },
    [meals]
  )

  const upsertMeal = useCallback(
    async (
      date: string,
      meal: MealType,
      title: string,
      notes: string | null
    ) => {
      let existingId: string | undefined

      setMeals((prev) => {
        const existing = prev.find(
          (m) => m.date === date && m.meal === meal
        )
        existingId = existing?.id
        const record: MealPlan = existing
          ? { ...existing, title, notes }
          : {
              id: crypto.randomUUID(),
              date,
              meal,
              title,
              notes,
              created_at: new Date().toISOString(),
            }
        return [
          ...prev.filter((m) => !(m.date === date && m.meal === meal)),
          record,
        ]
      })

      const supabase = createClient()
      const { error } = existingId
        ? await supabase
            .from("meal_plan")
            .update({ title, notes })
            .eq("id", existingId)
        : await supabase
            .from("meal_plan")
            .insert({ date, meal, title, notes })
      if (error) console.error("Failed to save meal:", error)
    },
    []
  )

  return { getMeal, upsertMeal }
}
