"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { InboxItem } from "@/lib/types"

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("inbox_items")
      .select("*")
      .is("delegated_date", null)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch inbox:", error)
        setItems((data as InboxItem[]) ?? [])
        setLoading(false)
      })
  }, [])

  const addItem = useCallback((title: string, tag: string | null) => {
    const item: InboxItem = {
      id: crypto.randomUUID(),
      title,
      tag,
      created_at: new Date().toISOString(),
      delegated_date: null,
      delegated_at: null,
    }
    setItems((prev) => [...prev, item])

    const supabase = createClient()
    supabase
      .from("inbox_items")
      .insert({ id: item.id, title, tag })
      .then(({ error }) => {
        if (error) console.error("Failed to add inbox item:", error)
      })
  }, [])

  const delegateItem = useCallback((id: string, date: string) => {
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
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))

    const supabase = createClient()
    supabase
      .from("inbox_items")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to delete inbox item:", error)
      })
  }, [])

  const markDelegated = useCallback((id: string, date: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))

    const supabase = createClient()
    supabase
      .from("inbox_items")
      .update({ delegated_date: date, delegated_at: new Date().toISOString() })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to mark inbox item delegated:", error)
      })
  }, [])

  return { items, loading, addItem, delegateItem, deleteItem, markDelegated }
}
