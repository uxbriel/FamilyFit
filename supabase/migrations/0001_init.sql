-- =====================================================================
-- FamilyFit — Esquema inicial
-- Planificador familiar de nutrición y entrenamiento (Perú)
--
-- Modelo: 1 cuenta de auth = 1 familia. Cada familia ve y edita
-- únicamente sus propios datos gracias a Row Level Security (RLS).
--
-- NOTA: Los ingredientes y platos NO se siembran aquí. La data peruana
-- de arranque vive en src/lib/seed/peruvian-seed.ts (editable) y se
-- inserta por familia desde la app la primera vez. Así los precios y
-- recetas siempre son editables y nunca quedan fijos en el código.
-- =====================================================================

-- ---------- Enums ----------
create type sex_t as enum ('male', 'female');
create type neat_level_t as enum ('sedentary', 'light', 'moderate', 'active');
create type goal_t as enum ('lose_fat', 'gain_muscle', 'recomp', 'maintain');
create type phase_t as enum ('phase1', 'phase2', 'phase3');
create type meal_type_t as enum ('breakfast', 'lunch', 'dinner', 'snack');

-- ---------- families ----------
-- Una fila por familia. owner_user_id la enlaza con la cuenta de auth.
create table families (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Mi familia',
  created_at    timestamptz not null default now()
);
create unique index families_owner_uidx on families (owner_user_id);

-- ---------- members ----------
-- Cada miembro de la familia con sus datos antropométricos y objetivo.
-- BMR / TDEE / calorías / macros NO se guardan: se calculan al vuelo
-- desde estos campos (ver src/lib/calc/energy.ts).
create table members (
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid not null references families (id) on delete cascade,
  name                text not null,
  age                 int  not null check (age between 1 and 120),
  sex                 sex_t not null,
  weight_kg           numeric(5,2) not null check (weight_kg > 0),
  height_cm           numeric(5,1) not null check (height_cm > 0),
  neat_level          neat_level_t not null default 'light',
  sport_type          text,
  sport_freq_per_week int not null default 0 check (sport_freq_per_week between 0 and 14),
  wants_gym           boolean not null default false,
  goal                goal_t not null default 'recomp',
  active_phase        phase_t not null default 'phase1',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index members_family_idx on members (family_id);

-- ---------- ingredients ----------
-- Editable (CRUD) por la familia. La info nutricional es por 100 g.
-- grams_per_unit convierte la unidad de compra a gramos para nutrición
-- y para escalar la lista de compras (kg = 1000; 1 huevo ≈ 50; etc.).
create table ingredients (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families (id) on delete cascade,
  name             text not null,
  purchase_unit    text not null default 'kg',          -- kg, unidad, atado, lata, litro...
  reference_price  numeric(10,2) not null default 0,    -- precio por unidad de compra (S/)
  grams_per_unit   numeric(10,2) not null default 1000, -- g por unidad de compra
  kcal_per_100g    numeric(8,2) not null default 0,
  protein_per_100g numeric(8,2) not null default 0,
  carbs_per_100g   numeric(8,2) not null default 0,
  fat_per_100g     numeric(8,2) not null default 0,
  is_seed          boolean not null default false,      -- true = vino de la data de arranque
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index ingredients_family_idx on ingredients (family_id);

-- ---------- dishes ----------
-- Plato peruano editable (CRUD). Su nutrición se calcula sumando sus
-- ingredientes (tabla dish_ingredients).
create table dishes (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  name        text not null,
  meal_type   meal_type_t not null default 'lunch',
  description text,
  is_seed     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index dishes_family_idx on dishes (family_id);

-- ---------- dish_ingredients (la receta) ----------
-- Gramos de cada ingrediente para UNA porción base del plato.
create table dish_ingredients (
  id                     uuid primary key default gen_random_uuid(),
  dish_id                uuid not null references dishes (id) on delete cascade,
  ingredient_id          uuid not null references ingredients (id) on delete restrict,
  grams_per_base_serving numeric(8,2) not null check (grams_per_base_serving > 0)
);
create index dish_ingredients_dish_idx on dish_ingredients (dish_id);
create index dish_ingredients_ingredient_idx on dish_ingredients (ingredient_id);

-- ---------- meal_plans (plan semanal) ----------
create table meal_plans (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families (id) on delete cascade,
  week_start_date date not null,
  created_at      timestamptz not null default now(),
  unique (family_id, week_start_date)
);
create index meal_plans_family_idx on meal_plans (family_id);

-- ---------- meal_plan_entries (qué plato cada día/comida) ----------
-- Toda la familia come el mismo plato; las porciones por miembro y la
-- lista de compras se DERIVAN (no se guardan).
create table meal_plan_entries (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans (id) on delete cascade,
  day_of_week  int not null check (day_of_week between 0 and 6), -- 0 = lunes
  meal_type    meal_type_t not null,
  dish_id      uuid not null references dishes (id) on delete cascade,
  unique (meal_plan_id, day_of_week, meal_type)
);
create index meal_plan_entries_plan_idx on meal_plan_entries (meal_plan_id);

-- =====================================================================
-- Trigger: crear la familia automáticamente al registrarse un usuario.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.families (owner_user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'family_name', 'Mi familia'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- updated_at automático
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_touch     before update on members     for each row execute function public.touch_updated_at();
create trigger ingredients_touch  before update on ingredients for each row execute function public.touch_updated_at();
create trigger dishes_touch       before update on dishes      for each row execute function public.touch_updated_at();
