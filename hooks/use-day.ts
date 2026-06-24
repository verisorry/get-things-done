"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, TaskTier } from "@/lib/types"

export function useDay(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("tasks")
      .select("*")
      .eq("date", date)
      .order("position")
      .then(({ data, error, status, statusText }) => {
        if (error) {
          console.error("Failed to fetch tasks:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            status,
            statusText,
          })
        }
        setTasks((data as Task[]) ?? [])
        setLoading(false)
      })
  }, [date])

  const addTask = useCallback(
    (tier: TaskTier, title: string) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        date,
        title,
        tier,
        time_start: null,
        time_end: null,
        completed: false,
        notes: null,
        position: Math.floor(Date.now() / 1000) % 2000000000,
        created_at: new Date().toISOString(),
      }
      setTasks((prev) => [...prev, newTask])

      const supabase = createClient()
      supabase.from("tasks").insert(newTask).then(({ error }) => {
        if (error) console.error("Failed to add task:", error)
      })
    },
    [date]
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
      const supabase = createClient()
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
      if (error) console.error("Failed to update task:", error)
    },
    []
  )

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) console.error("Failed to delete task:", error)
  }, [])

  return { tasks, loading, addTask, updateTask, deleteTask }
}
