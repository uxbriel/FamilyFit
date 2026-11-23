"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDishesWithRecipes, getFoodLogs, getMember } from "@/lib/data";
import { dishNutritionPerServing } from "@/lib/calc/nutrition";
import { nutritionForGrams, scaleNutrition, type LoggedNutrition } from "@/lib/calc/log";
import { addDays, isISODate, todayISO } from "@/lib/week";
import type { FoodLogKind, Ingredient, MealType } from "@/lib/supabase/types";

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(String(v ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function logUrl(memberId: string, date: string) {
  return `/log?member=${memberId}&date=${date}`;
}

function done(memberId: string, date: string): never {
  revalidatePath("/log");
  revalidatePath("/");
  redirect(logUrl(memberId, date));
}

export async function addFoodLog(formData: FormData) {
  const memberId = String(formData.get("member_id") ?? "");
  const member = await getMember(memberId);
  if (!member) throw new Error("Miembro no encontrado");

  const rawDate = String(formData.get("date") ?? "");
  const date = isISODate(rawDate) ? rawDate : todayISO();
  const rawMeal = String(formData.get("meal_type") ?? "") as MealType;
  const mealType = MEALS.includes(rawMeal) ? rawMeal : "snack";
  const kind = String(formData.get("kind") ?? "custom") as FoodLogKind;

  let name = "";
  let quantity: number | null = null;
  let dishId: string | null = null;
  let ingredientId: string | null = null;
  let n: LoggedNutrition;

  const supabase = createClient();

  if (kind === "dish") {
    dishId = String(formData.get("dish_id") ?? "");
    const dish = (await getDishesWithRecipes()).find((d) => d.id === dishId);
    if (!dish) throw new Error("Elige un plato");
    quantity = num(formData.get("servings"), 1) || 1;
    const base = dishNutritionPerServing(dish);
    n = scaleNutrition(
      { kcal: base.calories, proteinG: base.macros.proteinG, carbsG: base.macros.carbsG, fatG: base.macros.fatG },
      quantity,
    );
    name = quantity === 1 ? dish.name : `${dish.name} × ${quantity}`;
  } else if (kind === "ingredient") {
    ingredientId = String(formData.get("ingredient_id") ?? "");
    const { data: ing } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", ingredientId)
      .maybeSingle<Ingredient>();
    if (!ing) throw new Error("Elige un alimento");
    const amount = num(formData.get("amount"), 0);
    if (amount <= 0) throw new Error("Ingresa la cantidad");
    const unit = String(formData.get("unit") ?? "g");
    // Sin porción de referencia, una "porción" equivale a 100 g.
    const servingGrams = Number(ing.serving_grams) > 0 ? Number(ing.serving_grams) : 100;
    const servingLabel = ing.serving_label || "100 g";
    const grams = unit === "serving" ? amount * servingGrams : amount;
    quantity = grams;
    n = nutritionForGrams(
      {
        kcalPer100g: Number(ing.kcal_per_100g),
        proteinPer100g: Number(ing.protein_per_100g),
        carbsPer100g: Number(ing.carbs_per_100g),
        fatPer100g: Number(ing.fat_per_100g),
      },
      grams,
    );
    name =
      unit === "serving"
        ? `${ing.name} · ${amount} × ${servingLabel}`
        : `${ing.name} · ${Math.round(grams)} g`;
  } else {
    name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Ponle un nombre (ej. Fajitas de pollo en Chili's)");
    n = {
      kcal: num(formData.get("kcal")),
      proteinG: num(formData.get("protein_g")),
      carbsG: num(formData.get("carbs_g")),
      fatG: num(formData.get("fat_g")),
    };
  }

  const { error } = await supabase.from("food_logs").insert({
    family_id: member.family_id,
    member_id: memberId,
    logged_on: date,
    meal_type: mealType,
    kind: kind === "dish" || kind === "ingredient" ? kind : "custom",
    dish_id: dishId,
    ingredient_id: ingredientId,
    quantity,
    name,
    kcal: n.kcal,
    protein_g: n.proteinG,
    carbs_g: n.carbsG,
    fat_g: n.fatG,
  });
  if (error) throw new Error(error.message);

  done(memberId, date);
}

export async function deleteFoodLog(memberId: string, date: string, logId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("food_logs").delete().eq("id", logId);
  if (error) throw new Error(error.message);
  done(memberId, date);
}

/** Copia todo lo registrado el día anterior (útil si comes parecido a diario). */
export async function copyPreviousDay(memberId: string, date: string) {
  const member = await getMember(memberId);
  if (!member) throw new Error("Miembro no encontrado");
  const previous = await getFoodLogs(memberId, addDays(date, -1));
  if (previous.length) {
    const supabase = createClient();
    const { error } = await supabase.from("food_logs").insert(
      previous.map((l) => ({
        family_id: l.family_id,
        member_id: l.member_id,
        logged_on: date,
        meal_type: l.meal_type,
        kind: l.kind,
        dish_id: l.dish_id,
        ingredient_id: l.ingredient_id,
        quantity: l.quantity,
        name: l.name,
        kcal: l.kcal,
        protein_g: l.protein_g,
        carbs_g: l.carbs_g,
        fat_g: l.fat_g,
      })),
    );
    if (error) throw new Error(error.message);
  }
  done(memberId, date);
}
