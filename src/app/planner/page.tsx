import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PlanGrid } from "@/components/PlanGrid";
import { Disclaimer } from "@/components/Disclaimer";
import {
  getDishesWithRecipes,
  getFamily,
  getMembers,
  getCurrentWeekPlan,
} from "@/lib/data";
import { computeEnergy } from "@/lib/calc/energy";
import { memberToInput } from "@/lib/calc/adapt";
import {
  buildShoppingList,
  portionsForEntry,
  type PlanEntry,
} from "@/lib/calc/nutrition";
import { addWeeks, mondayOf, weekLabel } from "@/lib/week";
import { DAY_LABELS, MEAL_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const weekStart = searchParams.week ?? mondayOf();

  const [family, members, dishes] = await Promise.all([
    getFamily(),
    getMembers(),
    getDishesWithRecipes(),
  ]);
  const { entries } = family
    ? await getCurrentWeekPlan(family.id, weekStart)
    : { entries: [] };

  const dishesById = new Map(dishes.map((d) => [d.id, d]));

  // Miembros con sus calorías diarias objetivo.
  const membersForShopping = members.map((m) => ({
    id: m.id,
    name: m.name,
    dailyCalories: computeEnergy(memberToInput(m)).targetCalories,
  }));

  // Entradas del plan resueltas con su receta.
  const planEntries: PlanEntry[] = entries.flatMap((e) => {
    const dish = dishesById.get(e.dish_id);
    if (!dish) return [];
    return [{ dayOfWeek: e.day_of_week, mealType: e.meal_type, dish }];
  });

  const shopping =
    planEntries.length && membersForShopping.length
      ? buildShoppingList(planEntries, membersForShopping)
      : { items: [], totalCost: 0 };

  // Comidas presentes por día (para repartir calorías correctamente).
  const mealsByDay = new Map<number, PlanEntry["mealType"][]>();
  for (const e of planEntries) {
    const arr = mealsByDay.get(e.dayOfWeek) ?? [];
    if (!arr.includes(e.mealType)) arr.push(e.mealType);
    mealsByDay.set(e.dayOfWeek, arr);
  }

  const noDishes = dishes.length === 0;
  const noMembers = members.length === 0;

  return (
    <main className="px-4 py-3">
      <PageHeader title="Plan semanal" />

      {/* Navegación de semana */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/planner?week=${addWeeks(weekStart, -1)}`}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          ←
        </Link>
        <p className="text-sm font-semibold text-stone-700">{weekLabel(weekStart)}</p>
        <Link
          href={`/planner?week=${addWeeks(weekStart, 1)}`}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          →
        </Link>
      </div>

      {(noMembers || noDishes) && (
        <div className="card mb-4 text-sm text-stone-600">
          {noMembers && (
            <p>
              • Agrega miembros en{" "}
              <Link href="/members" className="font-semibold text-brand-600">
                Miembros
              </Link>{" "}
              para calcular porciones.
            </p>
          )}
          {noDishes && (
            <p>
              • Agrega platos en{" "}
              <Link href="/dishes" className="font-semibold text-brand-600">
                Platos
              </Link>{" "}
              para armar el plan.
            </p>
          )}
        </div>
      )}

      {/* Lista de compras */}
      {shopping.items.length > 0 && (
        <div className="card mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">🛒 Lista de compras</h2>
            <span className="font-bold text-brand-600">
              S/ {shopping.totalCost.toFixed(2)}
            </span>
          </div>
          <ul className="divide-y divide-stone-100 text-sm">
            {shopping.items.map((it) => (
              <li key={it.ingredientId} className="flex items-center justify-between py-1.5">
                <span className="text-stone-700">{it.name}</span>
                <span className="text-right">
                  <span className="font-medium">
                    {it.purchaseUnits} {it.purchaseUnit}
                  </span>
                  <span className="ml-2 text-stone-400">
                    S/ {it.estimatedCost.toFixed(2)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-400">
            Cantidades y costo estimados con los precios de tu Despensa. La familia come lo
            mismo; solo cambian las porciones.
          </p>
        </div>
      )}

      {/* Porciones por miembro */}
      {planEntries.length > 0 && members.length > 0 && (
        <div className="card mb-4">
          <h2 className="mb-2 text-sm font-semibold text-stone-700">
            🍽️ Porciones por miembro
          </h2>
          <div className="space-y-3">
            {planEntries
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((entry) => {
                const portions = portionsForEntry(
                  entry,
                  membersForShopping,
                  mealsByDay.get(entry.dayOfWeek) ?? [entry.mealType],
                );
                return (
                  <div key={`${entry.dayOfWeek}-${entry.mealType}`}>
                    <p className="text-xs font-semibold text-stone-500">
                      {DAY_LABELS[entry.dayOfWeek]} · {MEAL_LABELS[entry.mealType]} —{" "}
                      {entry.dish.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {portions.map((p) => (
                        <span
                          key={p.memberId}
                          className="chip bg-stone-100 text-stone-700"
                          title={`${p.calories} kcal · P${p.macros.proteinG} C${p.macros.carbsG} G${p.macros.fatG}`}
                        >
                          {p.memberName}: ×{p.factor} ({p.calories} kcal)
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Grilla editable */}
      {!noDishes && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-stone-700">Arma tu semana</h2>
          <PlanGrid
            weekStart={weekStart}
            dishes={dishes.map((d) => ({ id: d.id, name: d.name, mealType: d.mealType }))}
            entries={entries.map((e) => ({
              dayOfWeek: e.day_of_week,
              mealType: e.meal_type,
              dishId: e.dish_id,
            }))}
          />
        </>
      )}

      <div className="mt-4">
        <Disclaimer compact />
      </div>
    </main>
  );
}
