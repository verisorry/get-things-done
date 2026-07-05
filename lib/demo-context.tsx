"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Task, MonthlyGoal, MealPlan, InboxItem, PantryItem } from "./types"
import { DEMO_TASKS, DEMO_GOALS, DEMO_MEALS, DEMO_INBOX, DEMO_PANTRY } from "./demo-data"

export interface DemoContextValue {
  isDemo: true
  state: {
    tasks: Task[]
    goals: MonthlyGoal[]
    meals: MealPlan[]
    inbox: InboxItem[]
    pantry: PantryItem[]
  }
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setGoals: React.Dispatch<React.SetStateAction<MonthlyGoal[]>>
  setMeals: React.Dispatch<React.SetStateAction<MealPlan[]>>
  setInbox: React.Dispatch<React.SetStateAction<InboxItem[]>>
  setPantry: React.Dispatch<React.SetStateAction<PantryItem[]>>
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS)
  const [goals, setGoals] = useState<MonthlyGoal[]>(DEMO_GOALS)
  const [meals, setMeals] = useState<MealPlan[]>(DEMO_MEALS)
  const [inbox, setInbox] = useState<InboxItem[]>(DEMO_INBOX)
  const [pantry, setPantry] = useState<PantryItem[]>(DEMO_PANTRY)

  return (
    <DemoContext.Provider value={{ isDemo: true, state: { tasks, goals, meals, inbox, pantry }, setTasks, setGoals, setMeals, setInbox, setPantry }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoContext() {
  return useContext(DemoContext)
}
