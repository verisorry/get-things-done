"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { PantryCategory, PantryItem } from "@/lib/types"

export function usePantry() {
  const demo = useDemoContext()
  const [items, setItems] = useState<PantryItem[]>([])

  useEffect(() => {
    if (demo) return
    const supabase = createClient()
    supabase
      .from("pantry_items")
      .select("*")
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch pantry items:", error)
        setItems((data as PantryItem[]) ?? [])
      })
  }, [demo])

  const allItems = demo ? demo.state.pantry : items
  const sortedItems = [...allItems].sort((a, b) => a.position - b.position)
  const itemsRef = useRef<PantryItem[]>(allItems)
  itemsRef.current = allItems

  const addItem = useCallback(
    (title: string, category: PantryCategory) => {
      const item: PantryItem = {
        id: crypto.randomUUID(),
        title,
        category,
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
          title,
          category,
          position: item.position,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to add pantry item:", error)
        })
    },
    [demo]
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

  const reorderItem = useCallback(
    (itemId: string, category: PantryCategory, beforeItemId: string | null) => {
      const current = itemsRef.current
      const moved = current.find((i) => i.id === itemId)
      if (!moved) return

      const groupItems = current
        .filter((i) => i.id !== itemId && i.category === category)
        .sort((a, b) => a.position - b.position)

      const insertAt = beforeItemId
        ? groupItems.findIndex((i) => i.id === beforeItemId)
        : -1
      const idx = insertAt === -1 ? groupItems.length : insertAt
      groupItems.splice(idx, 0, { ...moved, category })

      const updates = groupItems.map((i, pos) => ({ id: i.id, position: (pos + 1) * 1000 }))

      if (demo) {
        demo.setPantry((prev) =>
          prev.map((i) => {
            const u = updates.find((u) => u.id === i.id)
            if (!u) return i
            return i.id === itemId ? { ...i, category, position: u.position } : { ...i, position: u.position }
          })
        )
        return
      }

      setItems((prev) =>
        prev.map((i) => {
          const u = updates.find((u) => u.id === i.id)
          if (!u) return i
          return i.id === itemId ? { ...i, category, position: u.position } : { ...i, position: u.position }
        })
      )

      const supabase = createClient()
      Promise.all(
        updates.map(({ id, position }) =>
          supabase
            .from("pantry_items")
            .update(id === itemId ? { category, position } : { position })
            .eq("id", id)
        )
      ).then((results) => {
        const failed = results.find((r) => r.error)
        if (failed?.error) console.error("Failed to reorder pantry items:", failed.error)
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

  return { items: sortedItems, addItem, toggleItem, reorderItem, deleteItem }
}
