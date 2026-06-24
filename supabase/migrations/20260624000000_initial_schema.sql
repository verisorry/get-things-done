do $$ begin
  create type task_tier as enum ('focus', 'important', 'immediate', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type meal_type as enum ('lunch', 'dinner');
exception when duplicate_object then null;
end $$;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  tier task_tier not null default 'other',
  time_start time,
  time_end time,
  completed boolean not null default false,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_date_idx on tasks (date);
create index if not exists tasks_date_tier_idx on tasks (date, tier);

create table if not exists monthly_goals (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  title text not null,
  target_count integer,
  completed_dates date[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (year, month, title)
);

create index if not exists monthly_goals_year_month_idx on monthly_goals (year, month);

create table if not exists meal_plan (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal meal_type not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (date, meal)
);

create index if not exists meal_plan_date_idx on meal_plan (date);

alter table tasks disable row level security;
alter table monthly_goals disable row level security;
alter table meal_plan disable row level security;
