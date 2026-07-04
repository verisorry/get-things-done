"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { InboxItem, TaskTier } from "@/lib/types"

export function useInbox() {
  const demo = useDemoContext()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(!demo)

  useEffect(() => {
    if (demo) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("inbox_items")
      .select("*")
      .is("delegated_date", null)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch inbox:", error)
        setItems((data as InboxItem[]) ?? [])
        setLoading(false)
      })
  }, [demo])

  const demoItems = demo ? demo.state.inbox : items
  const itemsRef = useRef<InboxItem[]>(demoItems)
  itemsRef.current = demoItems

  const addItem = useCallback((title: string, tag: string | null) => {
    const item: InboxItem = {
      id: crypto.randomUUID(),
      title,
      tag,
      position: Math.floor(Date.now() / 1000) % 2000000000,
      created_at: new Date().toISOString(),
      delegated_date: null,
      delegated_at: null,
    }

    if (demo) {
      demo.setInbox((prev) => [...prev, item])
      return
    }

    setItems((prev) => [...prev, item])
    const supabase = createClient()
    supabase
      .from("inbox_items")
      .insert({ id: item.id, title, tag, position: item.position })
      .then(({ error }) => {
        if (error) console.error("Failed to add inbox item:", error)
      })
  }, [demo])

  const reorderItem = useCallback(
    (itemId: string, tag: string | null, beforeItemId: string | null) => {
      const current = itemsRef.current
      const moved = current.find((i) => i.id === itemId)
      if (!moved) return

      const groupItems = current
        .filter((i) => i.id !== itemId && (i.tag ?? null) === tag)
        .sort((a, b) => a.position - b.position)

      const insertAt = beforeItemId
        ? groupItems.findIndex((i) => i.id === beforeItemId)
        : -1
      const idx = insertAt === -1 ? groupItems.length : insertAt
      groupItems.splice(idx, 0, { ...moved, tag })

      const updates = groupItems.map((i, pos) => ({ id: i.id, position: (pos + 1) * 1000 }))

      if (demo) {
        demo.setInbox((prev) =>
          prev.map((i) => {
            const u = updates.find((u) => u.id === i.id)
            if (!u) return i
            return i.id === itemId ? { ...i, tag, position: u.position } : { ...i, position: u.position }
          })
        )
        return
      }

      setItems((prev) =>
        prev.map((i) => {
          const u = updates.find((u) => u.id === i.id)
          if (!u) return i
          return i.id === itemId ? { ...i, tag, position: u.position } : { ...i, position: u.position }
        })
      )

      const supabase = createClient()
      Promise.all(
        updates.map(({ id, position }) =>
          supabase
            .from("inbox_items")
            .update(id === itemId ? { tag, position } : { position })
            .eq("id", id)
        )
      ).then((results) => {
        const failed = results.find((r) => r.error)
        if (failed?.error) console.error("Failed to reorder inbox items:", failed.error)
      })
    },
    [demo]
  )

  const delegateItem = useCallback((id: string, date: string) => {
    if (demo) {
      let found: InboxItem | undefined
      demo.setInbox((prev) => {
        found = prev.find((i) => i.id === id)
        return prev.filter((i) => i.id !== id)
      })
      if (found) {
        demo.setTasks((prev) => [...prev, {
          id: crypto.randomUUID(),
          date,
          title: found!.title,
          tier: "other" as TaskTier,
          time_start: null,
          time_end: null,
          completed: false,
          notes: null,
          source: null,
          position: Math.floor(Date.now() / 1000) % 2000000000,
          created_at: new Date().toISOString(),
        }])
      }
      return
    }

    let found: InboxItem | undefined
    setItems((prev) => {
      found = prev.find((i) => i.id === id)
      return prev.filter((i) => i.id !== id)
    })

    const now = new Date().toISOString()
    const supabase = createClient()

    supabase
      .from("inbox_items")
      .update({ delegated_date: date, delegated_at: now })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delegate inbox item:", error)
      })

    if (found) {
      supabase
        .from("tasks")
        .insert({
          date,
          title: found.title,
          tier: "other",
          completed: false,
          position: Math.floor(Date.now() / 1000) % 2000000000,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to create task from inbox:", error)
        })
    }
  }, [demo])

  const deleteItem = useCallback((id: string) => {
    if (demo) {
      demo.setInbox((prev) => prev.filter((i) => i.id !== id))
      return
    }

    setItems((prev) => prev.filter((i) => i.id !== id))
    const supabase = createClient()
    supabase
      .from("inbox_items")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete inbox item:", error)
      })
  }, [demo])

  const markDelegated = useCallback((id: string, date: string) => {
    if (demo) {
      demo.setInbox((prev) => prev.filter((i) => i.id !== id))
      return
    }

    setItems((prev) => prev.filter((i) => i.id !== id))
    const supabase = createClient()
    supabase
      .from("inbox_items")
      .update({ delegated_date: date, delegated_at: new Date().toISOString() })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to mark inbox item delegated:", error)
      })
  }, [demo])

  return { items: demoItems, loading, addItem, delegateItem, deleteItem, markDelegated, reorderItem }
}
