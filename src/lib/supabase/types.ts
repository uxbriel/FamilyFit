// Tipos de la base de datos (alineados con supabase/migrations).
// Si amplías el esquema, actualiza estos tipos o regenéralos con la CLI:
//   supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts

export type Sex = "male" | "female";
export type NeatLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose_fat" | "gain_muscle" | "recomp" | "maintain";
export type Phase = "phase1" | "phase2" | "phase3";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Family {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  name: string;
  age: number;
  sex: Sex;
  weight_kg: number;
  height_cm: number;
  neat_level: NeatLevel;
  sport_type: string | null;
  sport_freq_per_week: number;
  wants_gym: boolean;
  goal: Goal;
  active_phase: Phase;
  body_fat_pct: number | null;
  target_weight_kg: number | null;
  target_body_fat_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  family_id: string;
  name: string;
  purchase_unit: string;
  reference_price: number;
  grams_per_unit: number;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_label: string | null;
  serving_grams: number | null;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  family_id: string;
  name: string;
  meal_type: MealType;
  description: string | null;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DishIngredient {
  id: string;
  dish_id: string;
  ingredient_id: string;
  grams_per_base_serving: number;
}

export interface MealPlan {
  id: string;
  family_id: string;
  week_start_date: string;
  created_at: string;
}

export interface MealPlanEntry {
  id: string;
  meal_plan_id: string;
  day_of_week: number;
  meal_type: MealType;
  dish_id: string;
}

export type WorkoutKind = "strength" | "cardio" | "rest";
export type FoodLogKind = "dish" | "ingredient" | "custom";

export interface BodyMeasurement {
  id: string;
  family_id: string;
  member_id: string;
  measured_on: string;
  weight_kg: number;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  visceral_fat: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutExerciseRow {
  name: string;
  sets: number;
  reps: string;
}

export interface WorkoutDay {
  id: string;
  family_id: string;
  member_id: string;
  day_of_week: number;
  kind: WorkoutKind;
  title: string;
  notes: string | null;
  exercises: WorkoutExerciseRow[];
  updated_at: string;
}

export interface FoodLog {
  id: string;
  family_id: string;
  member_id: string;
  logged_on: string;
  meal_type: MealType;
  kind: FoodLogKind;
  dish_id: string | null;
  ingredient_id: string | null;
  quantity: number | null;
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}
