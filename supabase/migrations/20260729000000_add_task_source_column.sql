-- `source` tags a task row as a phantom time-block owned by something else
-- (a monthly goal, a meal, or another task split across multiple working
-- blocks) rather than a first-class item in the daily task list.
alter table tasks add column if not exists source text;

create index if not exists tasks_source_idx on tasks (source) where source is not null;
