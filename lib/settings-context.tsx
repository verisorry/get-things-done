"use client"

import { useEffect, type ReactNode } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface DaySettings {
  /** Hour (0-23) the day begins — drives both the time grid's start and task-list rollover. */
  dayStartHour: number
  /** Hour the day ends. Ranges from dayStartHour+1 to dayStartHour+24; values > 24 wrap into the next calendar day. */
  dayEndHour: number
}

export const DEFAULT_DAY_SETTINGS: DaySettings = { dayStartHour: 0, dayEndHour: 24 }

interface DaySettingsState {
  settings: DaySettings
  setSettings: (next: DaySettings) => void
}

// skipHydration avoids reading localStorage during the initial render, which would
// otherwise mismatch the server-rendered markup — we rehydrate explicitly on mount below.
const useDaySettingsStore = create<DaySettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_DAY_SETTINGS,
      setSettings: (next) => set({ settings: next }),
    }),
    { name: "day-settings", skipHydration: true }
  )
)

/**
 * Global day-start/day-end settings, persisted to localStorage and shared
 * across every component via Zustand — no context plumbing required.
 */
export function useDaySettings() {
  const settings = useDaySettingsStore((state) => state.settings)
  const setSettings = useDaySettingsStore((state) => state.setSettings)
  return { settings, setSettings }
}

/** Rehydrates the persisted store on mount (client-only, once). */
export function DaySettingsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useDaySettingsStore.persist.rehydrate()
  }, [])

  return children
}
