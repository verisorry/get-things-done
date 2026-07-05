alter table pantry_items add column if not exists category text not null default 'other'
  check (category in ('produce', 'meat', 'dairy', 'pantry', 'other'));

create index if not exists pantry_items_category_idx on pantry_items (category);
