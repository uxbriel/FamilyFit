-- =====================================================================
-- FamilyFit — Seguimiento: composición corporal, rutina personalizada,
-- porciones de referencia (suplementos) y registro diario de comidas.
-- Ejecutar después de 0001_init.sql y 0002_rls.sql.
-- =====================================================================

-- ---------- members: composición y meta ----------
alter table members
  add column if not exists body_fat_pct        numeric(4,1) check (body_fat_pct between 2 and 70),
  add column if not exists target_weight_kg    numeric(5,2) check (target_weight_kg > 0),
  add column if not exists target_body_fat_pct numeric(4,1) check (target_body_fat_pct between 2 and 70);

-- ---------- ingredients: porción de referencia (1 scoop, 1 cda, 1 huevo) ----------
alter table ingredients
  add column if not exists serving_label text,
  add column if not exists serving_grams numeric(8,2) check (serving_grams > 0);

-- ---------- Mediciones de balanza ----------
create table if not exists body_measurements (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families (id) on delete cascade,
  member_id        uuid not null references members (id) on delete cascade,
  measured_on      date not null default current_date,
  weight_kg        numeric(5,2) not null check (weight_kg > 0),
  body_fat_pct     numeric(4,1) check (body_fat_pct between 2 and 70),
  muscle_mass_kg   numeric(5,2) check (muscle_mass_kg > 0),
  visceral_fat     numeric(4,1) check (visceral_fat >= 0),
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists body_measurements_member_idx
  on body_measurements (member_id, measured_on desc);

-- ---------- Rutina personalizada (un registro por día de la semana) ----------
create type workout_kind_t as enum ('strength', 'cardio', 'rest');

create table if not exists workout_days (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  member_id   uuid not null references members (id) on delete cascade,
  day_of_week int  not null check (day_of_week between 0 and 6), -- 0 = lunes
  kind        workout_kind_t not null default 'rest',
  title       text not null default '',
  notes       text,
  -- [{ "name": "Press militar", "sets": 3, "reps": "8-12" }, ...]
  exercises   jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  unique (member_id, day_of_week)
);

-- ---------- Registro diario de comidas ----------
-- Guarda una "foto" de la nutrición al momento de registrar, para que el
-- historial no cambie si luego se edita o borra un plato o ingrediente.
create type food_log_kind_t as enum ('dish', 'ingredient', 'custom');

create table if not exists food_logs (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references families (id) on delete cascade,
  member_id      uuid not null references members (id) on delete cascade,
  logged_on      date not null default current_date,
  meal_type      meal_type_t not null,
  kind           food_log_kind_t not null,
  dish_id        uuid references dishes (id) on delete set null,
  ingredient_id  uuid references ingredients (id) on delete set null,
  quantity       numeric(8,2),           -- porciones (plato) o gramos (ingrediente)
  name           text not null,
  kcal           numeric(7,1) not null default 0 check (kcal >= 0),
  protein_g      numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g        numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g          numeric(6,1) not null default 0 check (fat_g >= 0),
  created_at     timestamptz not null default now()
);
create index if not exists food_logs_member_day_idx on food_logs (member_id, logged_on);

-- ---------- RLS ----------
alter table body_measurements enable row level security;
alter table workout_days      enable row level security;
alter table food_logs         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['body_measurements', 'workout_days', 'food_logs'] loop
    execute format($f$
      create policy %1$s_all on %1$s for all
        using (family_id in (select public.my_family_ids()))
        with check (family_id in (select public.my_family_ids()));
    $f$, t);
  end loop;
end $$;
