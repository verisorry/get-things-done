# Get Things Done

A personal productivity web app that digitises a physical "get things done" planner. Day-by-day task planning with time blocking, a four-tier task hierarchy, monthly goals, meal planning, and a flexible inbox.

## Live App

**[get-things-done-blond.vercel.app](https://get-things-done-blond.vercel.app/)**

## Demo

Try the app in demo mode with sample data — no account needed: **[get-things-done-blond.vercel.app/?demo=true](https://get-things-done-blond.vercel.app/?demo=true)**

This is a personal productivity tool. If you'd like access to the full app, email me at **fang.silvia2026@gmail.com**.

## Features

**Daily View** — An infinite horizontal scroll canvas showing day panels. Each day has a task list on the left and a time grid on the right. Scroll to navigate between days. Today auto-centers on load.

**Four-Tier Task Hierarchy**
- **Focus** — What will make today a win
- **Important** — What will affect your goals
- **Immediate** — What must be done today
- **Other** — Nice to complete

**Time Blocking** — Drag tasks from the task list onto the time grid to schedule them. Drag blocks to move them. Resize from the bottom edge to change duration. All snaps to 30-minute increments.

**Inbox** — A dump box for unscheduled items. Tag items with `@tag` syntax (e.g., `Buy groceries @personal`). Items are grouped by tag as sections. Drag items onto any day panel to schedule them under a specific tier. Use the calendar icon to delegate to a specific date.

**Monthly Goals** — Track recurring goals with a day-by-day completion grid. Set optional target counts. Navigate between months. Lives in the collapsible left sidebar.

**Meal Planning** — Lunch and dinner chips at the bottom of each day panel. A weekly meal grid in the sidebar for grocery planning. Click any cell to edit via popover.

**Dark Mode** — Defaults to system preference. Toggle with the sun/moon icon at the bottom of the left sidebar. Dark mode uses a frosted glass aesthetic.

**Demo Mode** — Visit with `?demo=true` to explore the app with sample data. All changes are in-memory and reset on refresh. No account required.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router)
- **UI:** [React 18](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- **Database:** [Supabase](https://supabase.com) (Postgres)
- **Auth:** [Supabase Auth](https://supabase.com/docs/guides/auth) (email/password)
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io)
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd get-things-done
   pnpm install
   ```

2. **Environment variables**

   Create `.env.local` with your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

3. **Database setup**

   Run the migration SQL in your Supabase dashboard (SQL Editor):

   ```sql
   -- Copy contents of supabase/migrations/20260624000000_initial_schema.sql
   -- Then: supabase/migrations/20260624000003_inbox_items.sql
   -- Then: supabase/migrations/20260624000004_inbox_tags.sql
   -- Then: supabase/migrations/20260624100000_add_user_id_and_rls.sql
   ```

   Or if using the Supabase CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. **Create your user account**

   In the Supabase dashboard, go to Authentication > Users > Add user. Create an account with email and password.

5. **Run**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  layout.tsx          # Root layout — theme + demo wrapper
  (app)/
    layout.tsx        # App shell — sidebar + inbox + day canvas
    page.tsx          # Infinite scroll day canvas with virtualization
  (auth)/
    auth/login/       # Login page
    auth/callback/    # OAuth callback handler
  globals.css         # Design tokens, theme variables, gradient background

components/
  day/
    DayPanel.tsx      # Single day card — header, tasks, time grid, meals
    TaskList.tsx      # Tiered task sections with inline add and drag-drop
    TaskCard.tsx      # Individual task — checkbox, edit popover, drag handle
    TimeGrid.tsx      # 30-min time slots with drag scheduling and resize
    MealPreview.tsx   # Lunch/dinner chips at bottom of task column
  GoalsSidebar.tsx    # Left icon rail + expandable goals/meals panels
  InboxPanel.tsx      # Resizable inbox with tag sections and delegation
  MealPlanPanel.tsx   # Weekly meal grid for the sidebar
  TopBar.tsx          # Date display, Today button, demo badge
  DemoWrapper.tsx     # Wraps app in DemoProvider when ?demo=true
  ThemeProvider.tsx   # Dark mode context with localStorage persistence

hooks/
  use-day.ts          # Task CRUD for a single date
  use-inbox.ts        # Inbox items with tags and delegation
  use-meal-plan.ts    # Single-day meal plan
  use-week-meal-plan.ts # Week-range meal plan
  use-monthly-goals.ts  # Monthly goals with completion tracking

lib/
  types.ts            # Shared TypeScript interfaces
  demo-context.tsx    # Demo mode context provider + in-memory state
  demo-data.ts        # Sample seed data for demo mode
  supabase/           # Supabase client (browser + server + middleware)
```

## Data Model

Four tables in Postgres, all with Row Level Security:

- **tasks** — Daily tasks with tier, time blocks, completion, notes
- **monthly_goals** — Recurring goals with completed_dates array
- **meal_plan** — Lunch/dinner per date with notes
- **inbox_items** — Unscheduled items with optional tags and delegation tracking

## AI Disclaimer

Parts of this project, including this entire README, was built with the assistance of AI agents. All code has been reviewed and tested by the developer.

## License

MIT
