import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DishForm } from "@/components/DishForm";
import { DeleteButton } from "@/components/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { getIngredients, getDishRecipe } from "@/lib/data";
import { deleteDish, updateDish } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditDishPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: dish } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!dish) notFound();

  const [ingredients, recipe] = await Promise.all([
    getIngredients(),
    getDishRecipe(dish.id),
  ]);

  const initialRecipe = recipe.map((r) => ({
    ingredient_id: r.ingredient_id,
    grams_per_base_serving: Number(r.grams_per_base_serving),
  }));

  return (
    <main className="px-4 py-3">
      <PageHeader title={`Editar ${dish.name}`} back="/dishes" />
      <DishForm
        dish={dish}
        ingredients={ingredients}
        initialRecipe={initialRecipe}
        action={updateDish.bind(null, dish.id)}
      />
      <div className="mt-3">
        <DeleteButton
          action={deleteDish.bind(null, dish.id)}
          label="Eliminar plato"
          confirmText={`¿Eliminar ${dish.name}?`}
        />
      </div>
    </main>
  );
}
