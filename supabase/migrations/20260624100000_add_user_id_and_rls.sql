-- Add user_id to all tables and enable RLS
-- Default to auth.uid() so client inserts don't need to pass user_id explicitly

-- tasks
alter table tasks add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
update tasks set user_id = (select id from auth.users limit 1) where user_id is null;
alter table tasks alter column user_id set not null;
alter table tasks enable row level security;

create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- monthly_goals
alter table monthly_goals add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
update monthly_goals set user_id = (select id from auth.users limit 1) where user_id is null;
alter table monthly_goals alter column user_id set not null;
alter table monthly_goals enable row level security;

create policy "Users can view own goals"
  on monthly_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on monthly_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on monthly_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on monthly_goals for delete
  using (auth.uid() = user_id);

-- meal_plan
alter table meal_plan add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
update meal_plan set user_id = (select id from auth.users limit 1) where user_id is null;
alter table meal_plan alter column user_id set not null;
alter table meal_plan enable row level security;

create policy "Users can view own meals"
  on meal_plan for select
  using (auth.uid() = user_id);

create policy "Users can insert own meals"
  on meal_plan for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meals"
  on meal_plan for update
  using (auth.uid() = user_id);

create policy "Users can delete own meals"
  on meal_plan for delete
  using (auth.uid() = user_id);

-- inbox_items
alter table inbox_items add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
update inbox_items set user_id = (select id from auth.users limit 1) where user_id is null;
alter table inbox_items alter column user_id set not null;
alter table inbox_items enable row level security;

create policy "Users can view own inbox"
  on inbox_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own inbox"
  on inbox_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own inbox"
  on inbox_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own inbox"
  on inbox_items for delete
  using (auth.uid() = user_id);
