"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data";
import type { MealType } from "@/lib/supabase/types";

interface RecipeLine {
  ingredient_id: string;
  grams_per_base_serving: number;
}

function parseDish(formData: FormData) {
  const recipeRaw = String(formData.get("recipe") ?? "[]");
  let recipe: RecipeLine[] = [];
  try {
    recipe = (JSON.parse(recipeRaw) as RecipeLine[]).filter(
      (l) => l.ingredient_id && l.grams_per_base_serving > 0,
    );
  } catch {
    recipe = [];
  }
  return {
    name: String(formData.get("name") ?? "").trim(),
    meal_type: String(formData.get("meal_type") ?? "lunch") as MealType,
    description: (String(formData.get("description") ?? "").trim() || null) as string | null,
    recipe,
  };
}

export async function createDish(formData: FormData) {
  const supabase = createClient();
  const family = await getFamily();
  if (!family) throw new Error("No se encontró la familia");

  const { name, meal_type, description, recipe } = parseDish(formData);
  const { data: dish, error } = await supabase
    .from("dishes")
    .insert({ family_id: family.id, name, meal_type, description, is_seed: false })
    .select("id")
    .single();
  if (error || !dish) throw new Error(error?.message ?? "Error al crear el plato");

  if (recipe.length) {
    const rows = recipe.map((l) => ({ dish_id: dish.id, ...l }));
    const { error: recErr } = await supabase.from("dish_ingredients").insert(rows);
    if (recErr) throw new Error(recErr.message);
  }

  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function updateDish(id: string, formData: FormData) {
  const supabase = createClient();
  const { name, meal_type, description, recipe } = parseDish(formData);

  const { error } = await supabase
    .from("dishes")
    .update({ name, meal_type, description })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Reemplaza la receta completa.
  await supabase.from("dish_ingredients").delete().eq("dish_id", id);
  if (recipe.length) {
    const rows = recipe.map((l) => ({ dish_id: id, ...l }));
    const { error: recErr } = await supabase.from("dish_ingredients").insert(rows);
    if (recErr) throw new Error(recErr.message);
  }

  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function deleteDish(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dishes");
  redirect("/dishes");
}
