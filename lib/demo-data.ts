import { format, addDays, subDays } from "date-fns"
import type { Task, MonthlyGoal, MealPlan, InboxItem, PantryItem } from "./types"

const today = new Date()
const todayStr = format(today, "yyyy-MM-dd")
const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd")
const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd")
const twoDaysAgo = format(subDays(today, 2), "yyyy-MM-dd")

export const DEMO_TASKS: Task[] = [
  // Today
  { id: "d-t1", date: todayStr, title: "Finalize portfolio homepage design", tier: "focus", time_start: "09:00", time_end: "10:30", completed: false, notes: null, source: null, position: 100, created_at: todayStr },
  { id: "d-t2", date: todayStr, title: "Review pull request for auth flow", tier: "important", time_start: "11:00", time_end: "11:30", completed: false, notes: null, source: null, position: 200, created_at: todayStr },
  { id: "d-t3", date: todayStr, title: "Reply to Sarah's email about project timeline", tier: "immediate", time_start: null, time_end: null, completed: true, notes: null, source: null, position: 300, created_at: todayStr },
  { id: "d-t4", date: todayStr, title: "Read chapter 5 of Designing Data-Intensive Applications", tier: "other", time_start: "20:00", time_end: "21:00", completed: false, notes: null, source: null, position: 400, created_at: todayStr },
  { id: "d-t5", date: todayStr, title: "Grocery run — pick up ingredients for tonight", tier: "immediate", time_start: "17:30", time_end: "18:00", completed: false, notes: null, source: null, position: 350, created_at: todayStr },

  // Yesterday
  { id: "d-t6", date: yesterdayStr, title: "Ship landing page v2", tier: "focus", time_start: "09:00", time_end: "12:00", completed: true, notes: null, source: null, position: 100, created_at: yesterdayStr },
  { id: "d-t7", date: yesterdayStr, title: "1:1 with manager", tier: "important", time_start: "14:00", time_end: "14:30", completed: true, notes: null, source: null, position: 200, created_at: yesterdayStr },
  { id: "d-t8", date: yesterdayStr, title: "Update project README", tier: "other", time_start: null, time_end: null, completed: true, notes: null, source: null, position: 300, created_at: yesterdayStr },

  // Tomorrow
  { id: "d-t9", date: tomorrowStr, title: "Write blog post draft on React patterns", tier: "focus", time_start: "09:00", time_end: "11:00", completed: false, notes: null, source: null, position: 100, created_at: tomorrowStr },
  { id: "d-t10", date: tomorrowStr, title: "Dentist appointment", tier: "immediate", time_start: "14:00", time_end: "15:00", completed: false, notes: null, source: null, position: 200, created_at: tomorrowStr },

  // Two days ago
  { id: "d-t11", date: twoDaysAgo, title: "Set up CI/CD pipeline", tier: "focus", time_start: "10:00", time_end: "12:00", completed: true, notes: null, source: null, position: 100, created_at: twoDaysAgo },
  { id: "d-t12", date: twoDaysAgo, title: "Call insurance company", tier: "immediate", time_start: null, time_end: null, completed: true, notes: null, source: null, position: 200, created_at: twoDaysAgo },
]

const currentMonth = today.getMonth() + 1
const currentYear = today.getFullYear()

export const DEMO_GOALS: MonthlyGoal[] = [
  { id: "d-g1", year: currentYear, month: currentMonth, title: "Read 30 minutes daily", target_count: 20, completed_dates: Array.from({ length: 12 }, (_, i) => format(subDays(today, i + 1), "yyyy-MM-dd")), created_at: todayStr },
  { id: "d-g2", year: currentYear, month: currentMonth, title: "Exercise 4x per week", target_count: 16, completed_dates: Array.from({ length: 8 }, (_, i) => format(subDays(today, i * 2 + 1), "yyyy-MM-dd")), created_at: todayStr },
  { id: "d-g3", year: currentYear, month: currentMonth, title: "No phone before 9am", target_count: null, completed_dates: Array.from({ length: 15 }, (_, i) => format(subDays(today, i + 1), "yyyy-MM-dd")), created_at: todayStr },
]

export const DEMO_MEALS: MealPlan[] = [
  { id: "d-m1", date: todayStr, meal: "lunch", title: "Chicken caesar salad", notes: null, created_at: todayStr },
  { id: "d-m2", date: todayStr, meal: "dinner", title: "Pasta carbonara", notes: "Use guanciale, not bacon", created_at: todayStr },
  { id: "d-m3", date: yesterdayStr, meal: "lunch", title: "Poke bowl", notes: null, created_at: yesterdayStr },
  { id: "d-m4", date: yesterdayStr, meal: "dinner", title: "Stir-fried tofu with rice", notes: null, created_at: yesterdayStr },
  { id: "d-m5", date: tomorrowStr, meal: "lunch", title: "Turkey avocado wrap", notes: null, created_at: tomorrowStr },
  { id: "d-m6", date: tomorrowStr, meal: "dinner", title: "Salmon with roasted vegetables", notes: "Asparagus, sweet potato, broccoli", created_at: tomorrowStr },
]

export const DEMO_PANTRY: PantryItem[] = [
  { id: "d-p1", title: "Chicken breast", category: "meat", checked: true, position: 1000, created_at: todayStr },
  { id: "d-p2", title: "Romaine lettuce", category: "produce", checked: true, position: 2000, created_at: todayStr },
  { id: "d-p3", title: "Tofu", category: "noodles", checked: false, position: 3000, created_at: todayStr },
  { id: "d-p4", title: "Guanciale", category: "meat", checked: false, position: 4000, created_at: todayStr },
  { id: "d-p5", title: "Udon", category: "noodles", checked: true, position: 5000, created_at: todayStr },
]

export const DEMO_INBOX: InboxItem[] = [
  { id: "d-i1", title: "Look into Tailwind v4 migration", tag: "dev", position: 1000, created_at: todayStr, delegated_date: null, delegated_at: null },
  { id: "d-i2", title: "Book flights for August trip", tag: "personal", position: 2000, created_at: todayStr, delegated_date: null, delegated_at: null },
  { id: "d-i3", title: "Send invoice to client", tag: "work", position: 3000, created_at: todayStr, delegated_date: null, delegated_at: null },
]
