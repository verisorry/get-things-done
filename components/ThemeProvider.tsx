"use client"

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "dark", toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  const stored = localStorage.getItem("theme") as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark"
}

let currentTheme: Theme = "dark"
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return currentTheme
}

function getServerSnapshot() {
  return "dark" as Theme
}

function setThemeValue(t: Theme) {
  currentTheme = t
  listeners.forEach((cb) => cb())
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    setThemeValue(getInitialTheme())

    const mq = window.matchMedia("(prefers-color-scheme: light)")
    function onSystemChange(e: MediaQueryListEvent) {
      // Only follow the system if the user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        setThemeValue(e.matches ? "light" : "dark")
      }
    }
    mq.addEventListener("change", onSystemChange)
    return () => mq.removeEventListener("change", onSystemChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  function toggle() {
    const next = theme === "light" ? "dark" : "light"
    setThemeValue(next)
    localStorage.setItem("theme", next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
