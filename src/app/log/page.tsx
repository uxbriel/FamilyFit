import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { DeleteButton } from "@/components/DeleteButton";
import {
  getDishesWithRecipes,
  getFoodLogs,
  getIngredients,
  getMembers,
  getWorkoutDays,
} from "@/lib/data";
import { computeEnergy } from "@/lib/calc/energy";
import { memberToInput } from "@/lib/calc/adapt";
import { dishNutritionPerServing } from "@/lib/calc/nutrition";
import { progressPct, remainingNutrition, sumNutrition } from "@/lib/calc/log";
import { MEAL_LABELS, MEAL_ORDER, WORKOUT_KIND_LABELS } from "@/lib/labels";
import { addDays, dayIndexMondayFirst, dayLabel, isISODate, todayISO } from "@/lib/week";
import type { MealType } from "@/lib/supabase/types";
import { addFoodLog, copyPreviousDay, deleteFoodLog } from "./actions";

export const dynamic = "force-dynamic";

type AddKind = "dish" | "ingredient" | "custom";

export default async function LogPage({
  searchParams,
}: {
  searchParams: { member?: string; date?: string; add?: string; meal?: string };
}) {
  const members = await getMembers();
  if (members.length === 0) {
    return (
      <main className="px-4 py-3">
        <PageHeader title="Diario" />
        <div className="card text-center text-sm text-stone-500">
          Primero agrega a un miembro de la familia.
          <Link href="/members/new" className="btn-primary mt-3 w-full">
            Agregar miembro
          </Link>
        </div>
      </main>
    );
  }

  const member = members.find((m) => m.id === searchParams.member) ?? members[0];
  const today = todayISO();
  const date = isISODate(searchParams.date) ? searchParams.date : today;
  const add: AddKind =
    searchParams.add === "dish" || searchParams.add === "custom" ? searchParams.add : "ingredient";
  const defaultMeal: MealType = MEAL_ORDER.includes(searchParams.meal as MealType)
    ? (searchParams.meal as MealType)
    : guessMeal();

  const [logs, dishes, ingredients, workoutDays] = await Promise.all([
    getFoodLogs(member.id, date),
    getDishesWithRecipes(),
    getIngredients(),
    getWorkoutDays(member.id),
  ]);

  const e = computeEnergy(memberToInput(member));
  const target = {
    kcal: e.targetCalories,
    proteinG: e.macros.proteinG,
    carbsG: e.macros.carbsG,
    fatG: e.macros.fatG,
  };
  const consumed = sumNutrition(
    logs.map((l) => ({
      kcal: Number(l.kcal),
      proteinG: Number(l.protein_g),
      carbsG: Number(l.carbs_g),
      fatG: Number(l.fat_g),
    })),
  );
  const left = remainingNutrition(target, consumed);
  const workout = workoutDays.find((d) => d.day_of_week === dayIndexMondayFirst(date));

  const url = (params: Record<string, string>) =>
    `/log?${new URLSearchParams({ member: member.id, date, add, ...params }).toString()}`;

  return (
    <main className="px-4 py-3">
      <PageHeader title="Diario" />

      {/* Miembro */}
      {members.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/log?member=${m.id}&date=${date}`}
              className={`chip whitespace-nowrap px-3 py-1.5 text-sm ${
                m.id === member.id ? "bg-brand-500 text-white" : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              {m.name}
            </Link>
          ))}
        </div>
      )}

      {/* Fecha */}
      <div className="mb-3 flex items-center justify-between">
        <Link href={url({ date: addDays(date, -1) })} className="btn-ghost px-3" aria-label="Día anterior">
          ←
        </Link>
        <div className="text-center">
          <p className="font-semibold capitalize text-stone-800">{dayLabel(date)}</p>
          {date !== today && (
            <Link href={url({ date: today })} className="text-xs text-brand-600">
              Ir a hoy
            </Link>
          )}
        </div>
        <Link href={url({ date: addDays(date, 1) })} className="btn-ghost px-3" aria-label="Día siguiente">
          →
        </Link>
      </div>

      {/* Resumen del día */}
      <div className="card mb-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-stone-400">{member.name} · consumido</p>
            <p className="text-3xl font-bold text-stone-800">
              {consumed.kcal}
              <span className="text-base font-medium text-stone-400"> / {target.kcal} kcal</span>
            </p>
          </div>
          {workout && workout.kind !== "rest" && (
            <span className="chip bg-brand-50 text-brand-600">
              🏋️ {workout.title || WORKOUT_KIND_LABELS[workout.kind]}
            </span>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <Progress label="Calorías" value={consumed.kcal} target={target.kcal} unit="kcal" color="bg-brand-500" />
          <Progress label="Proteína" value={consumed.proteinG} target={target.proteinG} unit="g" color="bg-rose-400" />
          <Progress label="Carbohidratos" value={consumed.carbsG} target={target.carbsG} unit="g" color="bg-amber-400" />
          <Progress label="Grasa" value={consumed.fatG} target={target.fatG} unit="g" color="bg-sky-400" />
        </div>
        <p className="mt-3 rounded-xl bg-stone-50 p-2 text-sm text-stone-700">
          {left.kcal >= 0
            ? `Te faltan ${left.kcal} kcal`
            : `Te pasaste por ${Math.abs(left.kcal)} kcal`}
          {left.proteinG > 0
            ? ` y ${left.proteinG} g de proteína.`
            : " y ya cumpliste tu proteína ✅"}
        </p>
      </div>

      {/* Comidas registradas */}
      <div className="card mb-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">Lo que comiste</h2>
          {logs.length === 0 && (
            <form action={copyPreviousDay.bind(null, member.id, date)}>
              <button className="text-xs text-brand-600">Copiar del día anterior</button>
            </form>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no registras nada este día.</p>
        ) : (
          <div className="space-y-3">
            {MEAL_ORDER.map((meal) => {
              const items = logs.filter((l) => l.meal_type === meal);
              if (items.length === 0) return null;
              const mealKcal = Math.round(items.reduce((s, l) => s + Number(l.kcal), 0));
              return (
                <div key={meal}>
                  <p className="flex justify-between text-xs font-semibold uppercase tracking-wide text-stone-400">
                    <span>{MEAL_LABELS[meal]}</span>
                    <span>{mealKcal} kcal</span>
                  </p>
                  <ul className="divide-y divide-stone-100">
                    {items.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 py-1.5">
                        <div className="min-w-0 text-sm">
                          <p className="truncate text-stone-700">{l.name}</p>
                          <p className="text-xs text-stone-400">
                            {Math.round(Number(l.kcal))} kcal · P{Number(l.protein_g)} C
                            {Number(l.carbs_g)} G{Number(l.fat_g)}
                          </p>
                        </div>
                        <div className="w-16 shrink-0">
                          <DeleteButton
                            action={deleteFoodLog.bind(null, member.id, date, l.id)}
                            label="✕"
                            confirmText={`¿Quitar "${l.name}"?`}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agregar */}
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">+ Agregar</h2>
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 text-center text-xs font-medium">
          {(
            [
              ["ingredient", "Alimento"],
              ["dish", "Plato"],
              ["custom", "Comí fuera"],
            ] as [AddKind, string][]
          ).map(([k, label]) => (
            <Link
              key={k}
              href={url({ add: k })}
              className={`rounded-lg py-1.5 ${add === k ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <form action={addFoodLog} className="space-y-3">
          <input type="hidden" name="member_id" value={member.id} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="kind" value={add} />
          <div>
            <label className="label" htmlFor="meal_type">
              Comida
            </label>
            <select id="meal_type" name="meal_type" className="input" defaultValue={defaultMeal}>
              {MEAL_ORDER.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {add === "ingredient" && (
            <>
              <div>
                <label className="label" htmlFor="ingredient_id">
                  Alimento o suplemento
                </label>
                <select id="ingredient_id" name="ingredient_id" className="input" required>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                      {i.serving_label && i.serving_grams
                        ? ` — ${i.serving_label} (${Number(i.serving_grams)} g)`
                        : " — 100 g"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="amount">
                    Cantidad
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={0}
                    defaultValue={1}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="unit">
                    Unidad
                  </label>
                  <select id="unit" name="unit" className="input" defaultValue="serving">
                    <option value="serving">Porción</option>
                    <option value="g">Gramos</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-stone-400">
                “Porción” usa la porción de referencia del alimento (1 scoop, 1 huevo…). Si no
                tiene, una porción = 100 g.
              </p>
            </>
          )}

          {add === "dish" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label" htmlFor="dish_id">
                  Plato
                </label>
                <select id="dish_id" name="dish_id" className="input" required>
                  {dishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {dishNutritionPerServing(d).calories} kcal
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="servings">
                  Porciones
                </label>
                <input
                  id="servings"
                  name="servings"
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min={0.25}
                  defaultValue={1}
                  className="input"
                />
              </div>
            </div>
          )}

          {add === "custom" && (
            <>
              <div>
                <label className="label" htmlFor="name">
                  ¿Qué comiste?
                </label>
                <input id="name" name="name" className="input" placeholder="Fajitas de pollo (Chili's)" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Num name="kcal" label="Calorías (kcal)" />
                <Num name="protein_g" label="Proteína (g)" />
                <Num name="carbs_g" label="Carbohidratos (g)" />
                <Num name="fat_g" label="Grasa (g)" />
              </div>
              <p className="text-xs text-stone-400">
                Si comes fuera, pon un estimado. Más vale anotar aproximado que no anotar.
              </p>
            </>
          )}

          <button className="btn-primary w-full">Registrar</button>
        </form>
      </div>
    </main>
  );
}

function Progress({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = progressPct(value, target);
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span className={pct > 105 ? "font-semibold text-red-600" : ""}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full ${pct > 105 ? "bg-red-500" : color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Num({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type="number" inputMode="decimal" step="1" min={0} className="input" />
    </div>
  );
}

/** Comida sugerida según la hora en Lima. */
function guessMeal(): MealType {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Lima" }).format(
      new Date(),
    ),
  );
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}
