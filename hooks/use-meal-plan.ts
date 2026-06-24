"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MealPlan, MealType } from "@/lib/types"

export function useMealPlan(date: string) {
  const [meals, setMeals] = useState<MealPlan[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("meal_plan")
      .select("*")
      .eq("date", date)
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch meals:", error)
        if (data) setMeals(data as MealPlan[])
      })
  }, [date])

  const lunch = meals.find((m) => m.meal === "lunch") ?? null
  const dinner = meals.find((m) => m.meal === "dinner") ?? null

  const upsertMeal = useCallback(
    async (meal: MealType, title: string, notes: string | null) => {
      let existingId: string | undefined

      setMeals((prev) => {
        const existing = prev.find((m) => m.meal === meal)
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
        return [...prev.filter((m) => m.meal !== meal), record]
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
    [date]
  )

  return { lunch, dinner, upsertMeal }
}
