import { PageHeader } from "@/components/PageHeader";
import { DishForm } from "@/components/DishForm";
import { getIngredients } from "@/lib/data";
import { createDish } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDishPage() {
  const ingredients = await getIngredients();
  return (
    <main className="px-4 py-3">
      <PageHeader title="Nuevo plato" back="/dishes" />
      <DishForm ingredients={ingredients} action={createDish} />
    </main>
  );
}
