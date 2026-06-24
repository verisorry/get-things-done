create table if not exists inbox_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now(),
  delegated_date date,
  delegated_at timestamptz
);

create index if not exists inbox_items_undelegated_idx
  on inbox_items (created_at)
  where delegated_date is null;

grant all on inbox_items to anon, authenticated;
