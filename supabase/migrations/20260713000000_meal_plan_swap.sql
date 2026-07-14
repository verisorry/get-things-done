-- Allow atomic swapping of two meal_plan rows' (date, meal) slots.
-- The unique(date, meal) constraint must be deferred so both updates in
-- swap_meal_plan_slots can be applied before the constraint is checked,
-- otherwise moving one row into the other's still-occupied slot violates
-- meal_plan_date_meal_key immediately.
alter table meal_plan
  drop constraint meal_plan_date_meal_key,
  add constraint meal_plan_date_meal_key unique (date, meal) deferrable initially deferred;

create or replace function swap_meal_plan_slots(
  p_from_id uuid,
  p_to_id uuid,
  p_from_date date,
  p_from_meal meal_type,
  p_to_date date,
  p_to_meal meal_type
) returns void
language plpgsql
security invoker
as $$
begin
  update meal_plan set date = p_to_date, meal = p_to_meal where id = p_from_id;

  if p_to_id is not null then
    update meal_plan set date = p_from_date, meal = p_from_meal where id = p_to_id;
  end if;
end;
$$;
