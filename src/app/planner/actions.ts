"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data";
import type { MealType } from "@/lib/supabase/types";

/** Crea (si no existe) el plan de la semana y devuelve su id. */
async function ensureWeekPlan(weekStart: string): Promise<string> {
  const supabase = createClient();
  const family = await getFamily();
  if (!family) throw new Error("No se encontró la familia");

  const { data: existing } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("family_id", family.id)
    .eq("week_start_date", weekStart)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("meal_plans")
    .insert({ family_id: family.id, week_start_date: weekStart })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "No se pudo crear el plan");
  return created.id;
}

/**
 * Asigna (o quita, si dishId es vacío) un plato a un día/comida concretos.
 */
export async function setPlanEntry(
  weekStart: string,
  dayOfWeek: number,
  mealType: MealType,
  dishId: string,
) {
  const supabase = createClient();
  const planId = await ensureWeekPlan(weekStart);

  if (!dishId) {
    await supabase
      .from("meal_plan_entries")
      .delete()
      .eq("meal_plan_id", planId)
      .eq("day_of_week", dayOfWeek)
      .eq("meal_type", mealType);
  } else {
    // upsert por (plan, día, comida)
    await supabase.from("meal_plan_entries").upsert(
      { meal_plan_id: planId, day_of_week: dayOfWeek, meal_type: mealType, dish_id: dishId },
      { onConflict: "meal_plan_id,day_of_week,meal_type" },
    );
  }

  revalidatePath("/planner");
}
