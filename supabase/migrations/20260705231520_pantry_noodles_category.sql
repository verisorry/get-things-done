-- Swap "dairy" for "noodles" (noodles / ready-made items like tofu, udon, konjac, yakisoba)
alter table pantry_items drop constraint if exists pantry_items_category_check;

update pantry_items set category = 'other' where category = 'dairy';

alter table pantry_items add constraint pantry_items_category_check
  check (category in ('produce', 'meat', 'noodles', 'pantry', 'other'));
