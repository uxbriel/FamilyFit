import "server-only";
import { createClient } from "./supabase/server";
import type {
  BodyMeasurement,
  Dish,
  FoodLog,
  DishIngredient,
  Family,
  Ingredient,
  MealPlan,
  MealPlanEntry,
  Member,
  WorkoutDay,
} from "./supabase/types";
import { buildDishWithRecipe } from "./calc/adapt";
import type { DishWithRecipe } from "./calc/nutrition";

export async function getFamily(): Promise<Family | null> {
  const supabase = createClient();
  const { data } = await supabase.from("families").select("*").maybeSingle();
  return data ?? null;
}

export async function getMembers(): Promise<Member[]> {
  const supabase = createClient();
  const { data } = await supabase.from("members").select("*").order("created_at");
  return data ?? [];
}

export async function getMember(id: string): Promise<Member | null> {
  const supabase = createClient();
  const { data } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getIngredients(): Promise<Ingredient[]> {
  const supabase = createClient();
  const { data } = await supabase.from("ingredients").select("*").order("name");
  return data ?? [];
}

export async function getDishes(): Promise<Dish[]> {
  const supabase = createClient();
  const { data } = await supabase.from("dishes").select("*").order("name");
  return data ?? [];
}

/** Platos con su receta resuelta (ingredientes + gramos), listos para calcular. */
export async function getDishesWithRecipes(): Promise<DishWithRecipe[]> {
  const supabase = createClient();
  const [{ data: dishes }, { data: dishIngredients }, ingredients] = await Promise.all([
    supabase.from("dishes").select("*").order("name"),
    supabase.from("dish_ingredients").select("*"),
    getIngredients(),
  ]);
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  return (dishes ?? []).map((d) =>
    buildDishWithRecipe(d as Dish, (dishIngredients ?? []) as DishIngredient[], byId),
  );
}

export async function getDishRecipe(dishId: string): Promise<DishIngredient[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dish_ingredients")
    .select("*")
    .eq("dish_id", dishId);
  return data ?? [];
}

export async function getCurrentWeekPlan(
  familyId: string,
  weekStart: string,
): Promise<{ plan: MealPlan | null; entries: MealPlanEntry[] }> {
  const supabase = createClient();
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("family_id", familyId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (!plan) return { plan: null, entries: [] };

  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("*")
    .eq("meal_plan_id", plan.id);

  return { plan, entries: entries ?? [] };
}

/** True si la familia aún no tiene ingredientes (necesita data de arranque). */
export async function familyNeedsSeed(): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from("ingredients")
    .select("*", { count: "exact", head: true });
  return (count ?? 0) === 0;
}

// --------------------------------------------------------------------
// Seguimiento
// --------------------------------------------------------------------

export async function getMeasurements(memberId: string, limit = 30): Promise<BodyMeasurement[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("member_id", memberId)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getWorkoutDays(memberId: string): Promise<WorkoutDay[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("workout_days")
    .select("*")
    .eq("member_id", memberId)
    .order("day_of_week");
  return (data ?? []).map((d) => ({
    ...d,
    exercises: Array.isArray(d.exercises) ? d.exercises : [],
  })) as WorkoutDay[];
}

export async function getFoodLogs(memberId: string, date: string): Promise<FoodLog[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("food_logs")
    .select("*")
    .eq("member_id", memberId)
    .eq("logged_on", date)
    .order("created_at");
  return data ?? [];
}

/** Registros de un día para toda la familia (para el resumen del inicio). */
export async function getFamilyFoodLogs(date: string): Promise<FoodLog[]> {
  const supabase = createClient();
  const { data } = await supabase.from("food_logs").select("*").eq("logged_on", date);
  return data ?? [];
}
