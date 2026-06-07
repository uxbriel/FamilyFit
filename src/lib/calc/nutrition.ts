// =====================================================================
// Cálculo nutricional de platos y lista de compras
// Todo se deriva de la base de datos editable (ingredientes + recetas),
// nunca de valores fijos. Funciones puras y testeables.
// =====================================================================

import type { Macros, MealType } from "./types";

export interface IngredientRef {
  id: string;
  name: string;
  purchaseUnit: string;
  referencePrice: number;
  gramsPerUnit: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface DishIngredientLine {
  ingredient: IngredientRef;
  gramsPerBaseServing: number;
}

/** Un plato con su receta resuelta (ingredientes + gramos). */
export interface DishWithRecipe {
  id: string;
  name: string;
  mealType: MealType;
  lines: DishIngredientLine[];
}

export interface DishNutrition {
  calories: number;
  macros: Pick<Macros, "proteinG" | "carbsG" | "fatG">;
}

/**
 * Reparto por defecto de las calorías diarias entre comidas.
 * Editable: si un plan no usa cierta comida, sus calorías se reparten
 * proporcionalmente entre las comidas presentes (ver caloriesForMeal).
 */
export const MEAL_DISTRIBUTION: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

/** Nutrición de UNA porción base del plato, sumando sus ingredientes. */
export function dishNutritionPerServing(dish: DishWithRecipe): DishNutrition {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;

  for (const line of dish.lines) {
    const factor = line.gramsPerBaseServing / 100;
    calories += line.ingredient.kcalPer100g * factor;
    proteinG += line.ingredient.proteinPer100g * factor;
    carbsG += line.ingredient.carbsPer100g * factor;
    fatG += line.ingredient.fatPer100g * factor;
  }

  return {
    calories: round(calories),
    macros: { proteinG: round(proteinG), carbsG: round(carbsG), fatG: round(fatG) },
  };
}

/**
 * Calorías que le tocan a un miembro en una comida concreta.
 * Reparte sus calorías diarias entre las comidas que realmente tiene
 * el plan ese día, según MEAL_DISTRIBUTION.
 */
export function caloriesForMeal(
  dailyCalories: number,
  meal: MealType,
  mealsPresentThatDay: MealType[],
): number {
  const totalWeight = mealsPresentThatDay.reduce((s, m) => s + MEAL_DISTRIBUTION[m], 0);
  if (totalWeight === 0) return 0;
  return round((dailyCalories * MEAL_DISTRIBUTION[meal]) / totalWeight);
}

/**
 * Factor de porción de un miembro para un plato:
 *   calorías que le tocan en esa comida ÷ calorías de la porción base.
 * Si el plato base no aporta calorías, devuelve 1 para evitar dividir por 0.
 */
export function portionFactor(memberMealCalories: number, dishBaseCalories: number): number {
  if (dishBaseCalories <= 0) return 1;
  return round(memberMealCalories / dishBaseCalories, 2);
}

// --------------------------------------------------------------------
// Lista de compras
// --------------------------------------------------------------------

export interface PlanEntry {
  dayOfWeek: number;
  mealType: MealType;
  dish: DishWithRecipe;
}

export interface MemberForShopping {
  id: string;
  name: string;
  dailyCalories: number;
}

export interface ShoppingLineItem {
  ingredientId: string;
  name: string;
  purchaseUnit: string;
  totalGrams: number;
  /** Unidades de compra exactas (gramos ÷ gramos por unidad). */
  purchaseUnits: number;
  referencePrice: number;
  estimatedCost: number;
}

export interface ShoppingList {
  items: ShoppingLineItem[];
  totalCost: number;
}

/** Porción individual de un miembro para una entrada del plan. */
export interface MemberPortion {
  memberId: string;
  memberName: string;
  factor: number;
  calories: number;
  macros: Pick<Macros, "proteinG" | "carbsG" | "fatG">;
}

/** Detalle de porciones por miembro para una entrada del plan. */
export function portionsForEntry(
  entry: PlanEntry,
  members: MemberForShopping[],
  mealsPresentThatDay: MealType[],
): MemberPortion[] {
  const base = dishNutritionPerServing(entry.dish);
  return members.map((m) => {
    const mealCals = caloriesForMeal(m.dailyCalories, entry.mealType, mealsPresentThatDay);
    const factor = portionFactor(mealCals, base.calories);
    return {
      memberId: m.id,
      memberName: m.name,
      factor,
      calories: round(base.calories * factor),
      macros: {
        proteinG: round(base.macros.proteinG * factor),
        carbsG: round(base.macros.carbsG * factor),
        fatG: round(base.macros.fatG * factor),
      },
    };
  });
}

/**
 * Lista de compras consolidada de toda la semana.
 * Para cada entrada del plan y cada miembro, calcula los gramos de cada
 * ingrediente (escala de la porción base) y los agrega por ingrediente,
 * convirtiéndolos a unidades de compra y costo estimado.
 */
export function buildShoppingList(
  entries: PlanEntry[],
  members: MemberForShopping[],
): ShoppingList {
  const byDay = groupMealsByDay(entries);
  const grams = new Map<string, { ref: IngredientRef; total: number }>();

  for (const entry of entries) {
    const base = dishNutritionPerServing(entry.dish);
    const mealsThatDay = byDay.get(entry.dayOfWeek) ?? [entry.mealType];

    for (const member of members) {
      const mealCals = caloriesForMeal(member.dailyCalories, entry.mealType, mealsThatDay);
      const factor = portionFactor(mealCals, base.calories);

      for (const line of entry.dish.lines) {
        const g = line.gramsPerBaseServing * factor;
        const acc = grams.get(line.ingredient.id);
        if (acc) acc.total += g;
        else grams.set(line.ingredient.id, { ref: line.ingredient, total: g });
      }
    }
  }

  const items: ShoppingLineItem[] = [];
  for (const { ref, total } of grams.values()) {
    const gramsPerUnit = ref.gramsPerUnit > 0 ? ref.gramsPerUnit : 1000;
    const purchaseUnits = round(total / gramsPerUnit, 2);
    const estimatedCost = round(purchaseUnits * ref.referencePrice, 2);
    items.push({
      ingredientId: ref.id,
      name: ref.name,
      purchaseUnit: ref.purchaseUnit,
      totalGrams: round(total),
      purchaseUnits,
      referencePrice: ref.referencePrice,
      estimatedCost,
    });
  }

  items.sort((a, b) => b.estimatedCost - a.estimatedCost);
  const totalCost = round(items.reduce((s, i) => s + i.estimatedCost, 0), 2);
  return { items, totalCost };
}

function groupMealsByDay(entries: PlanEntry[]): Map<number, MealType[]> {
  const map = new Map<number, MealType[]>();
  for (const e of entries) {
    const arr = map.get(e.dayOfWeek) ?? [];
    if (!arr.includes(e.mealType)) arr.push(e.mealType);
    map.set(e.dayOfWeek, arr);
  }
  return map;
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
