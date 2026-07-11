"use client"

import { useEffect, type ReactNode } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  isManual: boolean
  /** Explicit user action (the toggle button) — sticks across reloads and system-preference changes. */
  setTheme: (theme: Theme) => void
  /** System-preference-driven update — no-op once the user has set a manual preference. */
  applySystemTheme: (theme: Theme) => void
}

// skipHydration avoids reading localStorage during the initial render, which would
// otherwise mismatch the server-rendered markup — we rehydrate explicitly on mount below.
const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      isManual: false,
      setTheme: (theme) => set({ theme, isManual: true }),
      applySystemTheme: (theme) => {
        if (!get().isManual) set({ theme })
      },
    }),
    { name: "theme", skipHydration: true }
  )
)

export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  function toggle() {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return { theme, toggle }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)")

    function syncSystemTheme() {
      useThemeStore.getState().applySystemTheme(mq.matches ? "light" : "dark")
    }

    // Wait for the persisted preference to load before syncing, so a manual
    // preference from a previous session isn't briefly overwritten.
    Promise.resolve(useThemeStore.persist.rehydrate()).then(syncSystemTheme)

    function onSystemChange(e: MediaQueryListEvent) {
      useThemeStore.getState().applySystemTheme(e.matches ? "light" : "dark")
    }
    mq.addEventListener("change", onSystemChange)
    return () => mq.removeEventListener("change", onSystemChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  return children
}
