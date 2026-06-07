"use client";

import { useMemo, useState } from "react";
import type { Dish, Ingredient, MealType } from "@/lib/supabase/types";
import { MEAL_LABELS } from "@/lib/labels";

interface RecipeLine {
  ingredient_id: string;
  grams_per_base_serving: number;
}

type Props = {
  dish?: Dish;
  initialRecipe?: RecipeLine[];
  ingredients: Ingredient[];
  action: (formData: FormData) => void | Promise<void>;
};

// Constructor de platos: define la receta (ingredientes + gramos por
// porción base) y muestra en vivo las calorías y macros calculados.
export function DishForm({ dish, initialRecipe = [], ingredients, action }: Props) {
  const [lines, setLines] = useState<RecipeLine[]>(
    initialRecipe.length ? initialRecipe : [{ ingredient_id: "", grams_per_base_serving: 100 }],
  );

  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const totals = useMemo(() => {
    let kcal = 0,
      p = 0,
      c = 0,
      f = 0;
    for (const l of lines) {
      const ing = byId.get(l.ingredient_id);
      if (!ing) continue;
      const factor = (l.grams_per_base_serving || 0) / 100;
      kcal += Number(ing.kcal_per_100g) * factor;
      p += Number(ing.protein_per_100g) * factor;
      c += Number(ing.carbs_per_100g) * factor;
      f += Number(ing.fat_per_100g) * factor;
    }
    return {
      kcal: Math.round(kcal),
      p: Math.round(p),
      c: Math.round(c),
      f: Math.round(f),
    };
  }, [lines, byId]);

  function updateLine(idx: number, patch: Partial<RecipeLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { ingredient_id: "", grams_per_base_serving: 100 }]);
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="recipe" value={JSON.stringify(lines)} />

      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="name">
            Nombre del plato
          </label>
          <input id="name" name="name" className="input" defaultValue={dish?.name} required />
        </div>
        <div>
          <label className="label" htmlFor="meal_type">
            Tipo de comida
          </label>
          <select
            id="meal_type"
            name="meal_type"
            className="input"
            defaultValue={dish?.meal_type ?? "lunch"}
          >
            {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
              <option key={m} value={m}>
                {MEAL_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="description">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            className="input"
            rows={2}
            defaultValue={dish?.description ?? ""}
          />
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">Receta (1 porción base)</p>
          <button type="button" onClick={addLine} className="btn-ghost text-xs">
            + Ingrediente
          </button>
        </div>

        {ingredients.length === 0 && (
          <p className="text-xs text-red-600">
            Primero agrega ingredientes en la Despensa.
          </p>
        )}

        {lines.map((line, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <div className="flex-1">
              <select
                className="input"
                value={line.ingredient_id}
                onChange={(e) => updateLine(idx, { ingredient_id: e.target.value })}
              >
                <option value="">— Ingrediente —</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <input
                type="number"
                min={0}
                step="1"
                className="input"
                value={line.grams_per_base_serving}
                onChange={(e) =>
                  updateLine(idx, { grams_per_base_serving: Number(e.target.value) })
                }
                aria-label="gramos"
              />
            </div>
            <span className="pb-2.5 text-xs text-stone-400">g</span>
            <button
              type="button"
              onClick={() => removeLine(idx)}
              className="pb-2 text-stone-400"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="rounded-xl bg-stone-50 p-3 text-sm">
          <p className="font-semibold text-stone-700">Por porción base:</p>
          <p className="mt-1 text-stone-600">
            <strong className="text-brand-600">{totals.kcal} kcal</strong> · Prot {totals.p} g ·
            Carb {totals.c} g · Grasa {totals.f} g
          </p>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        {dish ? "Guardar cambios" : "Crear plato"}
      </button>
    </form>
  );
}
