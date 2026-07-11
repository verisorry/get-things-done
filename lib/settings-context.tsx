"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface DaySettings {
  /** Hour (0-23) the day begins — drives both the time grid's start and task-list rollover. */
  dayStartHour: number
  /** Hour the day ends. Ranges from dayStartHour+1 to dayStartHour+24; values > 24 wrap into the next calendar day. */
  dayEndHour: number
}

export const DEFAULT_DAY_SETTINGS: DaySettings = { dayStartHour: 0, dayEndHour: 24 }
const STORAGE_KEY = "day-settings"

const DaySettingsContext = createContext<{
  settings: DaySettings
  setSettings: (next: DaySettings) => void
}>({ settings: DEFAULT_DAY_SETTINGS, setSettings: () => {} })

export function useDaySettings() {
  return useContext(DaySettingsContext)
}

function loadSettings(): DaySettings {
  if (typeof window === "undefined") return DEFAULT_DAY_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DAY_SETTINGS
    const parsed = JSON.parse(raw)
    if (typeof parsed.dayStartHour === "number" && typeof parsed.dayEndHour === "number") {
      return parsed
    }
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_DAY_SETTINGS
}

export function DaySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<DaySettings>(DEFAULT_DAY_SETTINGS)

  useEffect(() => {
    setSettingsState(loadSettings())
  }, [])

  function setSettings(next: DaySettings) {
    setSettingsState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <DaySettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </DaySettingsContext.Provider>
  )
}
