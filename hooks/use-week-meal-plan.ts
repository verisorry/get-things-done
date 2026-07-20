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

      setMeals((prev) => {
        const existing = prev.find(
          (m) => m.date === date && m.meal === meal
        )
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
      const { data, error } = await supabase
        .from("meal_plan")
        .upsert({ date, meal, title, notes }, { onConflict: "date,meal" })
        .select()
        .single()
      if (error) {
        console.error("Failed to save meal:", error)
      } else {
        if (data) {
          setMeals((prev) => [
            ...prev.filter((m) => !(m.date === date && m.meal === meal)),
            data as MealPlan,
          ])
        }
        window.dispatchEvent(new CustomEvent("meal-changed", { detail: { date } }))
      }
    },
    [demo]
  )

  const deleteMeal = useCallback(
    async (date: string, meal: MealType) => {
      if (demo) {
        demo.setMeals((prev) =>
          prev.filter((m) => !(m.date === date && m.meal === meal))
        )
        return
      }

      let idToDelete: string | undefined
      setMeals((prev) => {
        idToDelete = prev.find((m) => m.date === date && m.meal === meal)?.id
        return prev.filter((m) => !(m.date === date && m.meal === meal))
      })

      if (idToDelete) {
        const supabase = createClient()
        const { error } = await supabase
          .from("meal_plan")
          .delete()
          .eq("id", idToDelete)
        if (error) console.error("Failed to delete meal:", error)
        else window.dispatchEvent(new CustomEvent("meal-changed", { detail: { date } }))
      }
    },
    [demo]
  )

  const swapMeals = useCallback(
    async (
      fromDate: string,
      fromMeal: MealType,
      toDate: string,
      toMeal: MealType
    ) => {
      const activeMeals = demo ? demo.state.meals : meals
      const from = activeMeals.find((m) => m.date === fromDate && m.meal === fromMeal)
      const to = activeMeals.find((m) => m.date === toDate && m.meal === toMeal)
      if (!from) return

      if (demo) {
        demo.setMeals((prev) => {
          const filtered = prev.filter(
            (m) => !(m.date === fromDate && m.meal === fromMeal) && !(m.date === toDate && m.meal === toMeal)
          )
          const records: MealPlan[] = [
            { ...from, date: toDate, meal: toMeal },
          ]
          if (to) records.push({ ...to, date: fromDate, meal: fromMeal })
          return [...filtered, ...records]
        })
        return
      }

      setMeals((prev) => {
        const filtered = prev.filter(
          (m) => !(m.date === fromDate && m.meal === fromMeal) && !(m.date === toDate && m.meal === toMeal)
        )
        const records: MealPlan[] = [{ ...from, date: toDate, meal: toMeal }]
        if (to) records.push({ ...to, date: fromDate, meal: fromMeal })
        return [...filtered, ...records]
      })

      const supabase = createClient()
      const { error } = await supabase.rpc("swap_meal_plan_slots", {
        p_from_id: from.id,
        p_to_id: to?.id ?? null,
        p_from_date: fromDate,
        p_from_meal: fromMeal,
        p_to_date: toDate,
        p_to_meal: toMeal,
      })
      if (error) console.error("Failed to swap meal:", error)
      else window.dispatchEvent(new CustomEvent("meal-changed", { detail: { dates: [fromDate, toDate] } }))
    },
    [demo, meals]
  )

  return { getMeal, upsertMeal, deleteMeal, swapMeals }
}
