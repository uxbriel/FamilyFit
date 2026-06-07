import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getDishesWithRecipes } from "@/lib/data";
import { dishNutritionPerServing } from "@/lib/calc/nutrition";
import { MEAL_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DishesPage() {
  const dishes = await getDishesWithRecipes();

  return (
    <main className="px-4 py-3">
      <PageHeader
        title="Platos peruanos"
        action={
          <Link href="/dishes/new" className="btn-primary text-xs">
            + Nuevo
          </Link>
        }
      />

      <p className="mb-3 text-xs text-stone-500">
        Cada plato se arma con ingredientes; sus calorías y macros se calculan solos.
        Edítalos o crea los tuyos.
      </p>

      {dishes.length === 0 ? (
        <p className="card text-center text-sm text-stone-500">Sin platos todavía.</p>
      ) : (
        <div className="space-y-2">
          {dishes.map((d) => {
            const n = dishNutritionPerServing(d);
            return (
              <Link
                key={d.id}
                href={`/dishes/${d.id}/edit`}
                className="card flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-stone-500">
                    {MEAL_LABELS[d.mealType]} · {d.lines.length} ingredientes
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-600">{n.calories} kcal</p>
                  <p className="text-xs text-stone-400">porción base</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
