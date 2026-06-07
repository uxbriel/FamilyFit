// Tipos de dominio compartidos por el motor de cálculo.
// Son independientes de la base de datos para mantener las fórmulas
// puras y testeables.

export type Sex = "male" | "female";
export type NeatLevel = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose_fat" | "gain_muscle" | "recomp" | "maintain";
export type Phase = "phase1" | "phase2" | "phase3";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

/** Datos mínimos de un miembro necesarios para los cálculos energéticos. */
export interface MemberInput {
  name: string;
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  neatLevel: NeatLevel;
  sportFreqPerWeek: number;
  goal: Goal;
  activePhase: Phase;
}

/** Gramos y porcentaje de cada macronutriente. */
export interface Macros {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

/** Resultado completo del cálculo energético de un miembro. */
export interface EnergyResult {
  bmr: number;
  activityFactor: number;
  tdee: number;
  /** Ajuste calórico aplicado por la fase, ej. -0.15 = déficit del 15%. */
  calorieAdjustment: number;
  targetCalories: number;
  /** Etiqueta legible del balance: déficit / mantenimiento / superávit. */
  balance: "deficit" | "maintenance" | "surplus";
  macros: Macros;
}

/** Información nutricional por 100 g de un ingrediente. */
export interface IngredientNutrition {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}
