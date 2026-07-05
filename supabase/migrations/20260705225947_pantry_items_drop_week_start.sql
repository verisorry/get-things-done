-- Pantry is a persistent ingredient list, not scoped to a single week
alter table pantry_items drop column if exists week_start;
