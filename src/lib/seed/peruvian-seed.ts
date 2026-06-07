// =====================================================================
// DATA DE ARRANQUE (SEED) — Platos e ingredientes peruanos
//
//  ⚠️  ESTO ES SOLO UN PUNTO DE PARTIDA EDITABLE.
//  Los precios y la información nutricional son referenciales (sector
//  socioeconómico B-C, mercado local) y DEBES ajustarlos a tu realidad.
//  Una vez creada tu familia, edita / amplía todo desde la app
//  (Ingredientes y Platos) o desde las tablas de Supabase.
//
//  La app NUNCA calcula con estos valores directamente: se insertan en
//  tu base de datos la primera vez y a partir de ahí mandan tus datos.
//
//  Precios en Soles (S/). Nutrición por 100 g del alimento como se compra.
// =====================================================================

export interface SeedIngredient {
  /** Clave interna para enlazar recetas; no se guarda en la BD. */
  slug: string;
  name: string;
  purchaseUnit: string;
  referencePrice: number; // S/ por unidad de compra
  gramsPerUnit: number; // gramos por unidad de compra
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface SeedDishLine {
  ingredientSlug: string;
  gramsPerBaseServing: number; // gramos en UNA porción base (~1 adulto)
}

export interface SeedDish {
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  lines: SeedDishLine[];
}

export const SEED_INGREDIENTS: SeedIngredient[] = [
  { slug: "arroz", name: "Arroz", purchaseUnit: "kg", referencePrice: 4.0, gramsPerUnit: 1000, kcalPer100g: 360, proteinPer100g: 7, carbsPer100g: 79, fatPer100g: 0.6 },
  { slug: "pollo", name: "Pollo (pechuga)", purchaseUnit: "kg", referencePrice: 12.0, gramsPerUnit: 1000, kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { slug: "lenteja", name: "Lentejas", purchaseUnit: "kg", referencePrice: 7.0, gramsPerUnit: 1000, kcalPer100g: 352, proteinPer100g: 24, carbsPer100g: 63, fatPer100g: 1 },
  { slug: "carne_res", name: "Carne de res (lomo)", purchaseUnit: "kg", referencePrice: 24.0, gramsPerUnit: 1000, kcalPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  { slug: "papa", name: "Papa blanca", purchaseUnit: "kg", referencePrice: 2.5, gramsPerUnit: 1000, kcalPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1 },
  { slug: "cebolla", name: "Cebolla roja", purchaseUnit: "kg", referencePrice: 3.0, gramsPerUnit: 1000, kcalPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.1 },
  { slug: "tomate", name: "Tomate", purchaseUnit: "kg", referencePrice: 3.5, gramsPerUnit: 1000, kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  { slug: "zanahoria", name: "Zanahoria", purchaseUnit: "kg", referencePrice: 2.5, gramsPerUnit: 1000, kcalPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  { slug: "arveja", name: "Arvejas", purchaseUnit: "kg", referencePrice: 4.0, gramsPerUnit: 1000, kcalPer100g: 81, proteinPer100g: 5, carbsPer100g: 14, fatPer100g: 0.4 },
  { slug: "aji_amarillo", name: "Ají amarillo", purchaseUnit: "kg", referencePrice: 8.0, gramsPerUnit: 1000, kcalPer100g: 40, proteinPer100g: 1, carbsPer100g: 8, fatPer100g: 0.4 },
  { slug: "aceite", name: "Aceite vegetal", purchaseUnit: "litro", referencePrice: 8.0, gramsPerUnit: 920, kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { slug: "ajo", name: "Ajo", purchaseUnit: "kg", referencePrice: 12.0, gramsPerUnit: 1000, kcalPer100g: 149, proteinPer100g: 6, carbsPer100g: 33, fatPer100g: 0.5 },
  { slug: "culantro", name: "Culantro", purchaseUnit: "atado", referencePrice: 1.0, gramsPerUnit: 50, kcalPer100g: 23, proteinPer100g: 2, carbsPer100g: 4, fatPer100g: 0.5 },
  { slug: "pan", name: "Pan francés", purchaseUnit: "unidad", referencePrice: 0.3, gramsPerUnit: 30, kcalPer100g: 290, proteinPer100g: 9, carbsPer100g: 56, fatPer100g: 2 },
  { slug: "leche_evaporada", name: "Leche evaporada", purchaseUnit: "lata", referencePrice: 3.8, gramsPerUnit: 410, kcalPer100g: 135, proteinPer100g: 6.8, carbsPer100g: 10, fatPer100g: 7.6 },
  { slug: "huevo", name: "Huevo", purchaseUnit: "unidad", referencePrice: 0.5, gramsPerUnit: 50, kcalPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { slug: "sillao", name: "Sillao (salsa de soya)", purchaseUnit: "botella", referencePrice: 5.0, gramsPerUnit: 500, kcalPer100g: 60, proteinPer100g: 8, carbsPer100g: 6, fatPer100g: 0 },
  { slug: "vinagre", name: "Vinagre", purchaseUnit: "botella", referencePrice: 3.0, gramsPerUnit: 500, kcalPer100g: 20, proteinPer100g: 0, carbsPer100g: 0.9, fatPer100g: 0 },
];

export const SEED_DISHES: SeedDish[] = [
  {
    name: "Arroz con pollo",
    mealType: "lunch",
    description: "Clásico peruano de arroz verde con presa de pollo y verduras.",
    lines: [
      { ingredientSlug: "arroz", gramsPerBaseServing: 120 },
      { ingredientSlug: "pollo", gramsPerBaseServing: 120 },
      { ingredientSlug: "aceite", gramsPerBaseServing: 10 },
      { ingredientSlug: "cebolla", gramsPerBaseServing: 30 },
      { ingredientSlug: "ajo", gramsPerBaseServing: 5 },
      { ingredientSlug: "culantro", gramsPerBaseServing: 20 },
      { ingredientSlug: "arveja", gramsPerBaseServing: 30 },
      { ingredientSlug: "zanahoria", gramsPerBaseServing: 30 },
      { ingredientSlug: "aji_amarillo", gramsPerBaseServing: 10 },
    ],
  },
  {
    name: "Lentejas con arroz",
    mealType: "lunch",
    description: "Guiso de lentejas económico y nutritivo, acompañado de arroz.",
    lines: [
      { ingredientSlug: "lenteja", gramsPerBaseServing: 80 },
      { ingredientSlug: "arroz", gramsPerBaseServing: 120 },
      { ingredientSlug: "aceite", gramsPerBaseServing: 8 },
      { ingredientSlug: "cebolla", gramsPerBaseServing: 30 },
      { ingredientSlug: "tomate", gramsPerBaseServing: 30 },
      { ingredientSlug: "ajo", gramsPerBaseServing: 5 },
    ],
  },
  {
    name: "Ají de gallina",
    mealType: "lunch",
    description: "Crema de pollo deshilachado con ají amarillo, pan y leche, sobre papa.",
    lines: [
      { ingredientSlug: "pollo", gramsPerBaseServing: 120 },
      { ingredientSlug: "pan", gramsPerBaseServing: 30 },
      { ingredientSlug: "leche_evaporada", gramsPerBaseServing: 60 },
      { ingredientSlug: "aceite", gramsPerBaseServing: 10 },
      { ingredientSlug: "cebolla", gramsPerBaseServing: 30 },
      { ingredientSlug: "aji_amarillo", gramsPerBaseServing: 20 },
      { ingredientSlug: "papa", gramsPerBaseServing: 100 },
    ],
  },
  {
    name: "Lomo saltado",
    mealType: "lunch",
    description: "Salteado de carne de res con cebolla y tomate, papas fritas y arroz.",
    lines: [
      { ingredientSlug: "carne_res", gramsPerBaseServing: 120 },
      { ingredientSlug: "papa", gramsPerBaseServing: 150 },
      { ingredientSlug: "cebolla", gramsPerBaseServing: 50 },
      { ingredientSlug: "tomate", gramsPerBaseServing: 50 },
      { ingredientSlug: "aceite", gramsPerBaseServing: 12 },
      { ingredientSlug: "sillao", gramsPerBaseServing: 10 },
      { ingredientSlug: "vinagre", gramsPerBaseServing: 5 },
      { ingredientSlug: "arroz", gramsPerBaseServing: 120 },
    ],
  },
];
