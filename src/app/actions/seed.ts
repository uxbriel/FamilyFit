"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data";
import { SEED_DISHES, SEED_INGREDIENTS } from "@/lib/seed/peruvian-seed";

/**
 * Inserta la data peruana de arranque en la familia actual, solo si aún
 * no tiene ingredientes. Idempotente. A partir de aquí la familia edita
 * todo desde la app o desde Supabase.
 */
export async function seedFamilyData() {
  const supabase = createClient();
  const family = await getFamily();
  if (!family) return { ok: false, error: "No se encontró la familia." };

  const { count } = await supabase
    .from("ingredients")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { ok: true, alreadySeeded: true };

  // 1) Ingredientes
  const ingredientRows = SEED_INGREDIENTS.map((i) => ({
    family_id: family.id,
    name: i.name,
    purchase_unit: i.purchaseUnit,
    reference_price: i.referencePrice,
    grams_per_unit: i.gramsPerUnit,
    kcal_per_100g: i.kcalPer100g,
    protein_per_100g: i.proteinPer100g,
    carbs_per_100g: i.carbsPer100g,
    fat_per_100g: i.fatPer100g,
    is_seed: true,
  }));
  const { data: insertedIngredients, error: ingErr } = await supabase
    .from("ingredients")
    .insert(ingredientRows)
    .select("id, name");
  if (ingErr) return { ok: false, error: ingErr.message };

  // Mapa slug -> id usando el nombre (insertados en el mismo orden).
  const slugToId = new Map<string, string>();
  SEED_INGREDIENTS.forEach((seed) => {
    const match = insertedIngredients?.find((row) => row.name === seed.name);
    if (match) slugToId.set(seed.slug, match.id);
  });

  // 2) Platos + recetas
  for (const dish of SEED_DISHES) {
    const { data: insertedDish, error: dishErr } = await supabase
      .from("dishes")
      .insert({
        family_id: family.id,
        name: dish.name,
        meal_type: dish.mealType,
        description: dish.description,
        is_seed: true,
      })
      .select("id")
      .single();
    if (dishErr || !insertedDish) return { ok: false, error: dishErr?.message };

    const recipeRows = dish.lines.flatMap((line) => {
      const ingredientId = slugToId.get(line.ingredientSlug);
      if (!ingredientId) return [];
      return [
        {
          dish_id: insertedDish.id,
          ingredient_id: ingredientId,
          grams_per_base_serving: line.gramsPerBaseServing,
        },
      ];
    });
    if (recipeRows.length) {
      const { error: recErr } = await supabase.from("dish_ingredients").insert(recipeRows);
      if (recErr) return { ok: false, error: recErr.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, seeded: true };
}
