"use client"

import { useEffect, useRef } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useDemoContext } from "@/lib/demo-context"
import type { Task } from "@/lib/types"

export function useTaskNotifications() {
  const demo = useDemoContext()
  const firedRef = useRef<Set<string>>(new Set())
  const tasksRef = useRef<Task[]>([])

  // Request notification permission once
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Load today's timed tasks and keep them fresh
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd")

    if (demo) {
      tasksRef.current = demo.state.tasks.filter(
        (t) => t.date === today && t.time_start !== null && !t.completed
      )
      return
    }

    const supabase = createClient()

    function load() {
      supabase
        .from("tasks")
        .select("*")
        .eq("date", today)
        .not("time_start", "is", null)
        .eq("completed", false)
        .then(({ data }) => {
          tasksRef.current = (data as Task[]) ?? []
        })
    }

    load()
    // Refresh every 5 minutes in case tasks were added
    const refresh = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(refresh)
  }, [demo])

  // Check every 30 seconds whether a task is starting right now
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return

    function check() {
      if (Notification.permission !== "granted") return

      const now = format(new Date(), "HH:mm")

      for (const task of tasksRef.current) {
        if (!task.time_start) continue
        // Normalize "HH:mm:ss" → "HH:mm"
        const taskTime = task.time_start.slice(0, 5)
        const key = `${task.id}:${taskTime}`

        if (taskTime === now && !firedRef.current.has(key)) {
          firedRef.current.add(key)
          new Notification(task.title, {
            body: task.time_end
              ? `${taskTime} – ${task.time_end.slice(0, 5)}`
              : taskTime,
            tag: key,
            silent: false,
          })
        }
      }
    }

    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [])
}
