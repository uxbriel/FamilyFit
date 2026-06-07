-- =====================================================================
-- FamilyFit — Row Level Security
-- Cada familia solo puede ver y modificar sus propias filas.
-- =====================================================================

-- Helper: ids de las familias que pertenecen al usuario actual.
create or replace function public.my_family_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select id from public.families where owner_user_id = auth.uid();
$$;

alter table families          enable row level security;
alter table members           enable row level security;
alter table ingredients       enable row level security;
alter table dishes            enable row level security;
alter table dish_ingredients  enable row level security;
alter table meal_plans        enable row level security;
alter table meal_plan_entries enable row level security;

-- ---------- families ----------
create policy families_select on families for select
  using (owner_user_id = auth.uid());
create policy families_update on families for update
  using (owner_user_id = auth.uid());
-- INSERT lo hace el trigger handle_new_user (security definer); no se
-- permite a los clientes crear familias arbitrarias.

-- ---------- Tablas con family_id directo ----------
-- members, ingredients, dishes, meal_plans
do $$
declare t text;
begin
  foreach t in array array['members', 'ingredients', 'dishes', 'meal_plans'] loop
    execute format($f$
      create policy %1$s_all on %1$s for all
        using (family_id in (select public.my_family_ids()))
        with check (family_id in (select public.my_family_ids()));
    $f$, t);
  end loop;
end $$;

-- ---------- dish_ingredients (a través del plato) ----------
create policy dish_ingredients_all on dish_ingredients for all
  using (dish_id in (select id from dishes where family_id in (select public.my_family_ids())))
  with check (dish_id in (select id from dishes where family_id in (select public.my_family_ids())));

-- ---------- meal_plan_entries (a través del plan) ----------
create policy meal_plan_entries_all on meal_plan_entries for all
  using (meal_plan_id in (select id from meal_plans where family_id in (select public.my_family_ids())))
  with check (meal_plan_id in (select id from meal_plans where family_id in (select public.my_family_ids())));
