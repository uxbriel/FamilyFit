"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data";
import { SEED_DISHES, SEED_INGREDIENTS } from "@/lib/seed/peruvian-seed";

type SeedResult =
  | { ok: false; error?: string }
  | { ok: true; seeded: boolean; addedIngredients: number; addedDishes: number };

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Inserta la data de arranque en la familia actual. Es idempotente:
 * solo agrega los ingredientes y platos que aún no existen (por nombre),
 * así que sirve tanto para una familia nueva como para sumar los nuevos
 * básicos y suplementos a una familia que ya tenía datos.
 * Nunca modifica ni borra lo que la familia ya editó.
 */
export async function seedFamilyData(): Promise<SeedResult> {
  const supabase = createClient();
  const family = await getFamily();
  if (!family) return { ok: false, error: "No se encontró la familia." };

  // 1) Ingredientes que faltan
  const { data: existingIngredients, error: exErr } = await supabase
    .from("ingredients")
    .select("id, name");
  if (exErr) return { ok: false, error: exErr.message };

  const idByName = new Map(
    (existingIngredients ?? []).map((row) => [normalize(row.name), row.id as string]),
  );
  const missingIngredients = SEED_INGREDIENTS.filter((i) => !idByName.has(normalize(i.name)));

  if (missingIngredients.length) {
    const { data: inserted, error: ingErr } = await supabase
      .from("ingredients")
      .insert(
        missingIngredients.map((i) => ({
          family_id: family.id,
          name: i.name,
          purchase_unit: i.purchaseUnit,
          reference_price: i.referencePrice,
          grams_per_unit: i.gramsPerUnit,
          kcal_per_100g: i.kcalPer100g,
          protein_per_100g: i.proteinPer100g,
          carbs_per_100g: i.carbsPer100g,
          fat_per_100g: i.fatPer100g,
          serving_label: i.servingLabel ?? null,
          serving_grams: i.servingGrams ?? null,
          is_seed: true,
        })),
      )
      .select("id, name");
    if (ingErr) return { ok: false, error: ingErr.message };
    for (const row of inserted ?? []) idByName.set(normalize(row.name), row.id);
  }

  const slugToId = new Map<string, string>();
  for (const seed of SEED_INGREDIENTS) {
    const id = idByName.get(normalize(seed.name));
    if (id) slugToId.set(seed.slug, id);
  }

  // 2) Platos que faltan + sus recetas
  const { data: existingDishes } = await supabase.from("dishes").select("name");
  const dishNames = new Set((existingDishes ?? []).map((d) => normalize(d.name)));
  const missingDishes = SEED_DISHES.filter((d) => !dishNames.has(normalize(d.name)));

  for (const dish of missingDishes) {
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

  const seeded = missingIngredients.length > 0 || missingDishes.length > 0;
  if (seeded) revalidatePath("/", "layout");
  return {
    ok: true,
    seeded,
    addedIngredients: missingIngredients.length,
    addedDishes: missingDishes.length,
  };
}

/** Versión para formularios: suma los básicos que falten a la despensa. */
export async function addMissingStarterData(): Promise<void> {
  const res = await seedFamilyData();
  if (!res.ok) throw new Error(res.error ?? "No se pudo agregar la data.");
}
