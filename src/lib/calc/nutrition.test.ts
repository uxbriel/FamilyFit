import { describe, expect, it } from "vitest";
import {
  buildShoppingList,
  caloriesForMeal,
  dishNutritionPerServing,
  portionFactor,
  type DishWithRecipe,
  type IngredientRef,
  type PlanEntry,
} from "./nutrition";

const rice: IngredientRef = {
  id: "rice",
  name: "Arroz",
  purchaseUnit: "kg",
  referencePrice: 4,
  gramsPerUnit: 1000,
  kcalPer100g: 130,
  proteinPer100g: 2.7,
  carbsPer100g: 28,
  fatPer100g: 0.3,
};

const chicken: IngredientRef = {
  id: "chicken",
  name: "Pollo",
  purchaseUnit: "kg",
  referencePrice: 12,
  gramsPerUnit: 1000,
  kcalPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
};

const arrozConPollo: DishWithRecipe = {
  id: "acp",
  name: "Arroz con pollo",
  mealType: "lunch",
  lines: [
    { ingredient: rice, gramsPerBaseServing: 150 },
    { ingredient: chicken, gramsPerBaseServing: 120 },
  ],
};

describe("dishNutritionPerServing", () => {
  it("suma la nutrición de los ingredientes de la porción base", () => {
    const n = dishNutritionPerServing(arrozConPollo);
    // arroz: 1.5*130=195 kcal; pollo: 1.2*165=198 kcal => 393
    expect(n.calories).toBe(393);
    // proteína: 1.5*2.7 + 1.2*31 = 4.05 + 37.2 = 41.25 -> 41
    expect(n.macros.proteinG).toBe(41);
  });
});

describe("caloriesForMeal", () => {
  it("reparte calorías diarias entre las comidas presentes", () => {
    // Solo lunch y dinner presentes: pesos 0.35 y 0.30 => total 0.65
    // lunch = 2000 * 0.35/0.65 = 1076.9 -> 1077
    expect(caloriesForMeal(2000, "lunch", ["lunch", "dinner"])).toBe(1077);
  });

  it("devuelve 0 si no hay comidas", () => {
    expect(caloriesForMeal(2000, "lunch", [])).toBe(0);
  });
});

describe("portionFactor", () => {
  it("escala según las calorías de la comida", () => {
    expect(portionFactor(786, 393)).toBe(2);
    expect(portionFactor(393, 393)).toBe(1);
  });
  it("evita dividir por cero", () => {
    expect(portionFactor(500, 0)).toBe(1);
  });
});

describe("buildShoppingList", () => {
  it("agrega ingredientes por toda la semana y calcula el costo", () => {
    const entries: PlanEntry[] = [
      { dayOfWeek: 0, mealType: "lunch", dish: arrozConPollo },
    ];
    const members = [
      { id: "a", name: "Papá", dailyCalories: 2400 },
      { id: "b", name: "Hijo", dailyCalories: 1800 },
    ];
    const list = buildShoppingList(entries, members);

    // Solo hay lunch ese día => mealCals = dailyCalories (peso único).
    // Papá: 2400/393 = 6.11 factor; Hijo: 1800/393 = 4.58
    // Arroz gramos = 150*(6.11+4.58) = 150*10.69 = 1603.5 -> ~1604 g -> 1.6 kg
    const arrozItem = list.items.find((i) => i.ingredientId === "rice")!;
    expect(arrozItem.totalGrams).toBeGreaterThan(1500);
    expect(arrozItem.purchaseUnit).toBe("kg");
    expect(arrozItem.estimatedCost).toBeGreaterThan(0);

    // El total es la suma de los costos.
    const sum = list.items.reduce((s, i) => s + i.estimatedCost, 0);
    expect(list.totalCost).toBeCloseTo(sum, 1);
    // Ordenado por costo descendente: el pollo (más caro) primero.
    expect(list.items[0].ingredientId).toBe("chicken");
  });
});
