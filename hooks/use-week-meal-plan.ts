"use client"

import { useCallback, useEffect, useState } from "react"
import { addDays, format, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { MealPlan, MealType } from "@/lib/types"

export function useWeekMealPlan(weekStartDate: string) {
  const demo = useDemoContext()
  const [meals, setMeals] = useState<MealPlan[]>([])

  useEffect(() => {
    if (demo) return
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
  }, [weekStartDate, demo])

  const activeMeals = demo ? demo.state.meals : meals

  const getMeal = useCallback(
    (date: string, type: MealType): MealPlan | null => {
      return activeMeals.find((m) => m.date === date && m.meal === type) ?? null
    },
    [activeMeals]
  )

  const upsertMeal = useCallback(
    async (
      date: string,
      meal: MealType,
      title: string,
      notes: string | null
    ) => {
      if (demo) {
        demo.setMeals((prev) => {
          const existing = prev.find((m) => m.date === date && m.meal === meal)
          const record: MealPlan = existing
            ? { ...existing, title, notes }
            : { id: crypto.randomUUID(), date, meal, title, notes, created_at: new Date().toISOString() }
          return [...prev.filter((m) => !(m.date === date && m.meal === meal)), record]
        })
        return
      }

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
    [demo]
  )

  return { getMeal, upsertMeal }
}
