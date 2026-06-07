import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Disclaimer } from "@/components/Disclaimer";
import { getIngredients } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const ingredients = await getIngredients();

  return (
    <main className="px-4 py-3">
      <PageHeader
        title="Despensa"
        action={
          <Link href="/ingredients/new" className="btn-primary text-xs">
            + Nuevo
          </Link>
        }
      />

      <p className="mb-3 text-xs text-stone-500">
        Precios e info nutricional editables. Ajústalos a tu mercado: la lista de compras
        se calcula con estos valores.
      </p>

      {ingredients.length === 0 ? (
        <p className="card text-center text-sm text-stone-500">
          Sin ingredientes todavía.
        </p>
      ) : (
        <div className="space-y-2">
          {ingredients.map((i) => (
            <Link
              key={i.id}
              href={`/ingredients/${i.id}/edit`}
              className="card flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {i.name}{" "}
                  {i.is_seed && (
                    <span className="chip bg-stone-100 text-stone-400">ejemplo</span>
                  )}
                </p>
                <p className="text-xs text-stone-500">
                  {Number(i.kcal_per_100g)} kcal · P{Number(i.protein_per_100g)} C
                  {Number(i.carbs_per_100g)} G{Number(i.fat_per_100g)} /100g
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-stone-700">
                  S/ {Number(i.reference_price).toFixed(2)}
                </p>
                <p className="text-xs text-stone-400">/ {i.purchase_unit}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Disclaimer compact />
      </div>
    </main>
  );
}
