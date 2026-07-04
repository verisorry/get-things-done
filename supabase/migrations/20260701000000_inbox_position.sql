alter table inbox_items add column if not exists position integer;

update inbox_items
set position = sub.rn * 1000
from (
  select id, row_number() over (order by created_at) as rn
  from inbox_items
) sub
where inbox_items.id = sub.id
  and inbox_items.position is null;

alter table inbox_items alter column position set default 0;
alter table inbox_items alter column position set not null;

create index if not exists inbox_items_position_idx on inbox_items (position);
