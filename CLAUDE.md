# CLAUDE.md — GTD Planner

A personal productivity web app that digitizes a physical "get things done" planner. Day-by-day task planning with time blocking, a four-tier task hierarchy, monthly recurring goals, and meal planning for lunch and dinner.

---

## Stack

- **Framework:** Next.js (App Router)
- **UI:** React + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (Postgres + Realtime)
- **Auth:** Supabase Auth (single-user, personal app)
- **Language:** TypeScript throughout

---

## Project Structure

```
/app
  /page.tsx             # Root — infinite scroll day canvas (primary view)
  /month/[year]/[month] # Monthly goals overview
  /meal-plan            # Weekly meal planning view
/components
  /day                # DayView, TimeBlock, TaskList, TaskCard
  /goals              # MonthlyGoalCard, GoalTracker
  /meals              # MealPlanGrid, MealSlot
  /ui                 # Shared primitives (Button, Input, etc.)
/lib
  /supabase.ts        # Client + server Supabase instances
  /types.ts           # All shared TypeScript types
  /utils.ts           # Date helpers, etc.
/hooks                # useDay, useMealPlan, useMonthlyGoals, etc.
```

---

## Data Model

### `tasks`
```ts
{
  id: uuid
  date: date                  // which day this task belongs to
  title: string
  tier: 'focus' | 'important' | 'immediate' | 'other'
  time_start: time | null     // for time-blocked tasks
  time_end: time | null
  completed: boolean
  notes: string | null
  created_at: timestamp
}
```

**Task tier hierarchy:**
1. **Focus** — What will make today a win
2. **Important** — What will affect your goals
3. **Immediate** — What must be done today
4. **Other** — Nice to complete

### `monthly_goals`
```ts
{
  id: uuid
  year: int
  month: int                  // 1–12
  title: string               // e.g. "Read a chapter of Educated"
  target_count: int | null    // e.g. 20 times this month (optional)
  completed_dates: date[]     // array of dates marked done
  created_at: timestamp
}
```

### `meal_plan`
```ts
{
  id: uuid
  date: date
  meal: 'lunch' | 'dinner'
  title: string               // dish name
  notes: string | null        // ingredients, prep notes, etc.
  created_at: timestamp
}
```

---

## Core Features

### Daily View — Infinite Horizontal Scroll (`/`)
The primary view is a horizontally scrollable calendar strip, similar to Apple Calendar's week view. Each day occupies a fixed-width "day panel" composed of two sub-columns side by side:

```
|←————————————— viewport (100vw) ————————————————→|

| ··· | [  Tasks  | Time grid ] [ Tasks | Time grid ] | ··· |
            ↑ yesterday              ↑ today (centered on load)
```

**Day panel anatomy:**
- Each day panel = two equal sub-columns: **Tasks** (left) + **Time Grid** (right)
- Panel width: ~`90vw` so two panels are visible at once, today centered
- A hairline vertical divider (`1px`) separates days; a slightly heavier divider separates Tasks from Time Grid within a day
- Day header (date + day of week) spans the full panel width, pinned to the top of its column

**Scrolling behavior:**
- Horizontal scroll is the primary navigation gesture — no prev/next buttons needed
- On load: scroll position auto-centers today (use `scrollIntoView` or manual `scrollLeft` calculation on mount)
- Virtualized: only render ~7 days around the current scroll position; load more days as the user scrolls toward either edge (similar to how Google Calendar lazily loads weeks)
- The time-of-day indicator (current time line) appears only on today's time grid

**Task list sub-column:**
- Tasks grouped by tier (Focus → Important → Immediate → Other), always in that order
- Tier label is a small all-caps eyebrow above each group
- Inline editing: click any task title to edit in place
- Add task button per tier section (appears on hover/focus of that section)
- Mark complete with a checkbox; completed tasks dim and move to the bottom of their tier group, don't disappear
- Meal plan preview pinned to the bottom of the task sub-column (lunch + dinner chips, tap to edit)

**Time grid sub-column:**
- 30-minute slots, 7am–11pm by default
- Hour labels in `font-mono`, left-aligned, small
- Tasks with time blocks render as filled blocks, color-coded by tier
- Clicking an empty slot opens a quick-add for a time-blocked task
- The time grid scrolls vertically independently of the horizontal scroll (sticky header + scrollable body within the column)

### Monthly Goals (`/month`)
- List of recurring goals for the current month
- Each goal shows a small completion tracker (e.g. 12/20 days)
- Tap a date to mark that goal done for the day
- Goals carry over month-to-month if re-added (no auto-rollover — intentional)
- Can set an optional target count per month

### Meal Planning
- Accessible from the day view (inline) and a dedicated `/meal-plan` weekly grid view
- Weekly grid: days as columns, lunch/dinner as rows
- Click any cell to add/edit a meal
- Notes field for ingredients or prep reminders

---

## Design

### Visual Direction
Soft card-based UI — each day lives in its own floating panel with a subtle shadow and rounded corners. Feels native and calm, closer to a productivity app than a document. Reference: the attached screenshot aesthetic but with neutral grays instead of purple/pink gradients.

- **Palette:**
  - Background: `#F2F2F7` (Apple system grouped background — the gray behind the cards)
  - Card surface: `#FFFFFF`
  - Primary text: `#000000`
  - Secondary text: `#3C3C43` at 60% opacity
  - Separator: `#3C3C43` at 12% opacity
  - Today badge: `#000000` background, `#FFFFFF` text (not colored — no gradients)
  - Interactive / focus: `#007AFF` (system blue, used sparingly)

- **Tier colors** (left border on time blocks, subtle background tint on task rows):
  - Focus: `#000000` (black)
  - Important: `#FF9500` (system orange)
  - Immediate: `#FF3B30` (system red)
  - Other: `#8E8E93` (system gray)

- **Typography:** `-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`. Day name bold and large (`font-semibold text-xl`), date in a small pill badge next to it. Time labels in `ui-monospace`, small and secondary.

- **Cards:** Each day panel is a white card with `border-radius: 16px` and `box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)`. No border — shadow does the separation work.

- **Checkboxes:** Circular, not square. Use a custom circle checkbox (shadcn Checkbox overridden with `rounded-full`). Unchecked: outlined circle. Checked: filled circle with a checkmark, dimmed text with strikethrough.

- **Spacing:** Comfortable padding inside cards (`p-4`). Task rows have generous vertical padding (`py-2.5`) so the list breathes. 8pt grid throughout.

- **No gradients anywhere.** The background stays flat gray, cards stay flat white. The only visual depth comes from the card shadow.

### Component Library
Use **shadcn/ui** as the default component source. Before writing any custom UI primitive, check if shadcn covers it. Key components to use:
- `Button`, `Input`, `Textarea` — all form controls
- `Checkbox` — task completion
- `Popover` — inline task editing, time picker
- `Dialog` — meal plan edit, monthly goal edit
- `Badge` — tier labels
- `Separator` — day dividers, section dividers
- `ScrollArea` — time grid vertical scroll container

Override shadcn's default CSS variables in `globals.css` to match the Apple palette above rather than using shadcn's default slate/zinc theme. Keep the component structure, just retheme the tokens.

### Layout Rules
- The infinite scroll canvas is the entire page — no traditional page chrome
- A slim fixed top bar holds: today button, a date label that updates as you scroll, and nav links (Month, Meals). Nothing else.
- Day panels are the atomic layout unit: each is `~90vw` wide, split 50/50 into task and time sub-columns
- The time grid sub-column scrolls vertically within its fixed-height container; the horizontal canvas scrolls the whole strip
- On mobile: each day panel goes full-width (`100vw`); task and time sub-columns stack vertically (tasks on top, time grid below, collapsible)

---

## Agent Instructions

When working on this codebase:

**Always check types first.** Before writing any component or hook, look at `/lib/types.ts`. Add new types there before using them elsewhere. Never use `any`.

**Supabase queries go in hooks.** All data fetching and mutation lives in `/hooks`. Components don't import the Supabase client directly.

**Date handling.** Always use `date-fns` for date manipulation. Dates are stored as ISO strings (`YYYY-MM-DD`). The visible center day is tracked in React state (not the URL) since the view is a continuous scroll canvas — update a `currentDate` context value as the user scrolls past day boundaries.

**Virtualize the scroll canvas.** Don't render every day ever — maintain a window of ~14 days (7 past, 7 future) around the current scroll center. Prepend/append day panels as the user scrolls toward either edge. Use a `useInfiniteScroll` or Intersection Observer pattern on sentinel nodes at either end of the rendered strip.

**Scroll-to-today on mount.** On first render, use `element.scrollIntoView({ behavior: 'instant', inline: 'center' })` on the today panel ref. Don't animate this — it should feel like the view just opens centered on today.

**shadcn first, custom second.** Before writing any UI primitive, check if shadcn has it (`npx shadcn@latest add <component>`). Only write custom components for things shadcn doesn't cover (the day panel, time grid, scroll canvas). Don't wrap shadcn components unnecessarily — use them directly.

**Task ordering.** Within a tier, tasks should be orderable by drag-and-drop (use a `position` int column in Supabase). Add this from the start — retrofitting it is painful.

**Optimistic UI.** Mutations (marking complete, editing title, adding task) should update local state immediately and sync to Supabase in the background. Don't wait for the round-trip.

**Don't touch the time grid until tasks work.** Build the flat task list per tier first, confirm data model works, then layer in time blocking.

**Meal plan is secondary.** It should always be one click away from the day view but never clutter it. Inline meal section at the bottom of the day view is enough for v1.

---

## Out of Scope (v1)

- Multi-user / sharing
- Mobile app (responsive web is enough)
- Recurring tasks (monthly goals covers this use case)
- Calendar integrations
- AI suggestions