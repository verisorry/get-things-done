"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { Task, TaskTier } from "@/lib/types"

export function useDay(date: string) {
  const demo = useDemoContext()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(!demo)

  useEffect(() => {
    if (demo) return
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
  }, [date, demo])

  const demoTasks = demo ? demo.state.tasks.filter((t) => t.date === date) : tasks
  const tasksRef = useRef<Task[]>(demoTasks)
  tasksRef.current = demoTasks

  const addTask = useCallback(
    (tier: TaskTier, title: string, timeStart?: string, timeEnd?: string) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        date,
        title,
        tier,
        time_start: timeStart ?? null,
        time_end: timeEnd ?? null,
        completed: false,
        notes: null,
        source: null,
        position: Math.floor(Date.now() / 1000) % 2000000000,
        created_at: new Date().toISOString(),
      }

      if (demo) {
        demo.setTasks((prev) => [...prev, newTask])
        return
      }

      setTasks((prev) => [...prev, newTask])
      const supabase = createClient()
      supabase.from("tasks").insert(newTask).then(({ error }) => {
        if (error) console.error("Failed to add task:", error)
      })
    },
    [date, demo]
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (demo) {
        demo.setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
        return
      }

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
    [demo]
  )

  const deleteTask = useCallback(async (id: string) => {
    if (demo) {
      demo.setTasks((prev) => prev.filter((t) => t.id !== id))
      return
    }

    setTasks((prev) => prev.filter((t) => t.id !== id))
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) console.error("Failed to delete task:", error)
  }, [demo])

  const upsertTimedBlock = useCallback(
    async (source: string, title: string, tier: TaskTier, timeStart: string, timeEnd: string) => {
      const existing = tasksRef.current.find((t) => t.source === source)

      if (demo) {
        if (existing) {
          demo.setTasks((prev) =>
            prev.map((t) =>
              t.id === existing.id ? { ...t, title, tier, time_start: timeStart, time_end: timeEnd } : t
            )
          )
        } else {
          const newTask: Task = {
            id: crypto.randomUUID(),
            date,
            title,
            tier,
            source,
            time_start: timeStart,
            time_end: timeEnd,
            completed: false,
            notes: null,
            position: 0,
            created_at: new Date().toISOString(),
          }
          demo.setTasks((prev) => [...prev, newTask])
        }
        return
      }

      if (existing) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === existing.id ? { ...t, title, tier, time_start: timeStart, time_end: timeEnd } : t
          )
        )
        const supabase = createClient()
        const { error } = await supabase
          .from("tasks")
          .update({ title, tier, time_start: timeStart, time_end: timeEnd })
          .eq("id", existing.id)
        if (error) console.error("Failed to update timed block:", error)
      } else {
        const newTask: Task = {
          id: crypto.randomUUID(),
          date,
          title,
          tier,
          source,
          time_start: timeStart,
          time_end: timeEnd,
          completed: false,
          notes: null,
          position: 0,
          created_at: new Date().toISOString(),
        }
        setTasks((prev) => [...prev, newTask])
        const supabase = createClient()
        const { error } = await supabase.from("tasks").insert(newTask)
        if (error) console.error("Failed to insert timed block:", error)
      }
    },
    [date, demo]
  )

  return { tasks: demoTasks, loading, addTask, updateTask, deleteTask, upsertTimedBlock }
}
