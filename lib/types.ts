export type TaskTier = 'focus' | 'important' | 'immediate' | 'other'

export type MealType = 'lunch' | 'dinner'

export interface Task {
  id: string
  date: string
  title: string
  tier: TaskTier
  time_start: string | null
  time_end: string | null
  completed: boolean
  notes: string | null
  position: number
  source: string | null
  created_at: string
}

export interface MonthlyGoal {
  id: string
  year: number
  month: number
  title: string
  target_count: number | null
  completed_dates: string[]
  created_at: string
}

export interface InboxItem {
  id: string
  title: string
  tag: string | null
  position: number
  created_at: string
  delegated_date: string | null
  delegated_at: string | null
}

export interface MealPlan {
  id: string
  date: string
  meal: MealType
  title: string
  notes: string | null
  created_at: string
}

export interface PantryItem {
  id: string
  week_start: string
  title: string
  checked: boolean
  position: number
  created_at: string
}
