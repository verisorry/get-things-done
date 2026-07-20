"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { MealPlan, MealType } from "@/lib/types"

export function useMealPlan(date: string) {
  const demo = useDemoContext()
  const [meals, setMeals] = useState<MealPlan[]>([])

  function fetchMeals() {
    const supabase = createClient()
    supabase
      .from("meal_plan")
      .select("*")
      .eq("date", date)
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch meals:", error)
        if (data) setMeals(data as MealPlan[])
      })
  }

  useEffect(() => {
    if (demo) return
    fetchMeals()
  }, [date, demo])

  useEffect(() => {
    if (demo) return
    function handleMealChanged(e: Event) {
      const detail = (e as CustomEvent).detail as { date?: string; dates?: string[] }
      const affected = detail.dates ?? (detail.date ? [detail.date] : [])
      if (affected.includes(date)) fetchMeals()
    }
    window.addEventListener("meal-changed", handleMealChanged)
    return () => window.removeEventListener("meal-changed", handleMealChanged)
  }, [date, demo])

  const dayMeals = demo ? demo.state.meals.filter((m) => m.date === date) : meals
  const lunch = dayMeals.find((m) => m.meal === "lunch") ?? null
  const dinner = dayMeals.find((m) => m.meal === "dinner") ?? null

  const upsertMeal = useCallback(
    async (meal: MealType, title: string, notes: string | null) => {
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
        const existing = prev.find((m) => m.meal === meal)
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
      const { data, error } = await supabase
        .from("meal_plan")
        .upsert({ date, meal, title, notes }, { onConflict: "date,meal" })
        .select()
        .single()
      if (error) {
        console.error("Failed to save meal:", error)
      } else {
        if (data) {
          setMeals((prev) => [...prev.filter((m) => m.meal !== meal), data as MealPlan])
        }
        window.dispatchEvent(new CustomEvent("meal-changed", { detail: { date } }))
      }
    },
    [date, demo]
  )

  return { lunch, dinner, upsertMeal }
}
