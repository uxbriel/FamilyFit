"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data";

function parseIngredient(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    purchase_unit: String(formData.get("purchase_unit") ?? "kg").trim(),
    reference_price: Number(formData.get("reference_price") ?? 0),
    grams_per_unit: Number(formData.get("grams_per_unit") ?? 1000),
    kcal_per_100g: Number(formData.get("kcal_per_100g") ?? 0),
    protein_per_100g: Number(formData.get("protein_per_100g") ?? 0),
    carbs_per_100g: Number(formData.get("carbs_per_100g") ?? 0),
    fat_per_100g: Number(formData.get("fat_per_100g") ?? 0),
  };
}

export async function createIngredient(formData: FormData) {
  const supabase = createClient();
  const family = await getFamily();
  if (!family) throw new Error("No se encontró la familia");

  const { error } = await supabase
    .from("ingredients")
    .insert({ family_id: family.id, is_seed: false, ...parseIngredient(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/ingredients");
  redirect("/ingredients");
}

export async function updateIngredient(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ingredients")
    .update(parseIngredient(formData))
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/ingredients");
  redirect("/ingredients");
}

export async function deleteIngredient(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  // Si el ingrediente está en una receta, la BD lo impide (restrict).
  if (error)
    throw new Error(
      error.message.includes("violates foreign key")
        ? "No se puede eliminar: está en uso por un plato."
        : error.message,
    );

  revalidatePath("/ingredients");
  redirect("/ingredients");
}
