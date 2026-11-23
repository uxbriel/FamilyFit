// =====================================================================
// Registro diario: nutrición de lo comido y lo que falta del día.
// Funciones puras y testeables.
// =====================================================================

import type { IngredientNutrition } from "./types";

export interface LoggedNutrition {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const ZERO: LoggedNutrition = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };

/** Nutrición de X gramos de un ingrediente (valores por 100 g). */
export function nutritionForGrams(ing: IngredientNutrition, grams: number): LoggedNutrition {
  const f = Math.max(grams, 0) / 100;
  return {
    kcal: round(ing.kcalPer100g * f),
    proteinG: round(ing.proteinPer100g * f, 1),
    carbsG: round(ing.carbsPer100g * f, 1),
    fatG: round(ing.fatPer100g * f, 1),
  };
}

/** Escala la nutrición de una porción base por N porciones. */
export function scaleNutrition(base: LoggedNutrition, servings: number): LoggedNutrition {
  const s = Math.max(servings, 0);
  return {
    kcal: round(base.kcal * s),
    proteinG: round(base.proteinG * s, 1),
    carbsG: round(base.carbsG * s, 1),
    fatG: round(base.fatG * s, 1),
  };
}

/** Suma una lista de registros. */
export function sumNutrition(items: LoggedNutrition[]): LoggedNutrition {
  const t = items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      proteinG: acc.proteinG + i.proteinG,
      carbsG: acc.carbsG + i.carbsG,
      fatG: acc.fatG + i.fatG,
    }),
    { ...ZERO },
  );
  return {
    kcal: round(t.kcal),
    proteinG: round(t.proteinG, 1),
    carbsG: round(t.carbsG, 1),
    fatG: round(t.fatG, 1),
  };
}

/** Lo que falta (positivo) o lo que se pasó (negativo) respecto al objetivo. */
export function remainingNutrition(
  target: LoggedNutrition,
  consumed: LoggedNutrition,
): LoggedNutrition {
  return {
    kcal: round(target.kcal - consumed.kcal),
    proteinG: round(target.proteinG - consumed.proteinG, 1),
    carbsG: round(target.carbsG - consumed.carbsG, 1),
    fatG: round(target.fatG - consumed.fatG, 1),
  };
}

/** Porcentaje cumplido (0–100+), útil para barras de progreso. */
export function progressPct(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((consumed / target) * 100);
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
