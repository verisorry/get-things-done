"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { PantryItem } from "@/lib/types"

export function usePantry(weekStart: string) {
  const demo = useDemoContext()
  const [items, setItems] = useState<PantryItem[]>([])

  useEffect(() => {
    if (demo) return
    const supabase = createClient()
    supabase
      .from("pantry_items")
      .select("*")
      .eq("week_start", weekStart)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch pantry items:", error)
        setItems((data as PantryItem[]) ?? [])
      })
  }, [weekStart, demo])

  const allItems = demo ? demo.state.pantry : items
  const weekItems = allItems
    .filter((i) => i.week_start === weekStart)
    .sort((a, b) => a.position - b.position)

  const addItem = useCallback(
    (title: string) => {
      const item: PantryItem = {
        id: crypto.randomUUID(),
        week_start: weekStart,
        title,
        checked: false,
        position: Math.floor(Date.now() / 1000) % 2000000000,
        created_at: new Date().toISOString(),
      }

      if (demo) {
        demo.setPantry((prev) => [...prev, item])
        return
      }

      setItems((prev) => [...prev, item])
      const supabase = createClient()
      supabase
        .from("pantry_items")
        .insert({
          id: item.id,
          week_start: weekStart,
          title,
          position: item.position,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to add pantry item:", error)
        })
    },
    [demo, weekStart]
  )

  const toggleItem = useCallback(
    (id: string) => {
      if (demo) {
        demo.setPantry((prev) =>
          prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
        )
        return
      }

      let nextChecked = false
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i
          nextChecked = !i.checked
          return { ...i, checked: nextChecked }
        })
      )

      const supabase = createClient()
      supabase
        .from("pantry_items")
        .update({ checked: nextChecked })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to update pantry item:", error)
        })
    },
    [demo]
  )

  const deleteItem = useCallback(
    (id: string) => {
      if (demo) {
        demo.setPantry((prev) => prev.filter((i) => i.id !== id))
        return
      }

      setItems((prev) => prev.filter((i) => i.id !== id))
      const supabase = createClient()
      supabase
        .from("pantry_items")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Failed to delete pantry item:", error)
        })
    },
    [demo]
  )

  return { items: weekItems, addItem, toggleItem, deleteItem }
}
