// Adaptadores entre las filas de la base de datos y el motor de cálculo
// (que trabaja con tipos camelCase independientes de la BD).
import type { Dish, DishIngredient, Ingredient, Member } from "../supabase/types";
import type { DishWithRecipe, IngredientRef } from "./nutrition";
import type { MemberInput } from "./types";

export function memberToInput(m: Member): MemberInput {
  return {
    name: m.name,
    age: m.age,
    sex: m.sex,
    weightKg: Number(m.weight_kg),
    heightCm: Number(m.height_cm),
    neatLevel: m.neat_level,
    sportFreqPerWeek: m.sport_freq_per_week,
    goal: m.goal,
    activePhase: m.active_phase,
  };
}

export function ingredientToRef(i: Ingredient): IngredientRef {
  return {
    id: i.id,
    name: i.name,
    purchaseUnit: i.purchase_unit,
    referencePrice: Number(i.reference_price),
    gramsPerUnit: Number(i.grams_per_unit),
    kcalPer100g: Number(i.kcal_per_100g),
    proteinPer100g: Number(i.protein_per_100g),
    carbsPer100g: Number(i.carbs_per_100g),
    fatPer100g: Number(i.fat_per_100g),
  };
}

/** Construye un plato con su receta resuelta a partir de filas de la BD. */
export function buildDishWithRecipe(
  dish: Dish,
  dishIngredients: DishIngredient[],
  ingredientsById: Map<string, Ingredient>,
): DishWithRecipe {
  const lines = dishIngredients
    .filter((di) => di.dish_id === dish.id)
    .flatMap((di) => {
      const ing = ingredientsById.get(di.ingredient_id);
      if (!ing) return [];
      return [
        {
          ingredient: ingredientToRef(ing),
          gramsPerBaseServing: Number(di.grams_per_base_serving),
        },
      ];
    });

  return { id: dish.id, name: dish.name, mealType: dish.meal_type, lines };
}
