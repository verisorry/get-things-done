create table if not exists pantry_items (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  title text not null,
  checked boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

create index if not exists pantry_items_week_start_idx on pantry_items (week_start);

alter table pantry_items enable row level security;

create policy "Users can view own pantry items"
  on pantry_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own pantry items"
  on pantry_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pantry items"
  on pantry_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own pantry items"
  on pantry_items for delete
  using (auth.uid() = user_id);

grant all on pantry_items to anon, authenticated;
