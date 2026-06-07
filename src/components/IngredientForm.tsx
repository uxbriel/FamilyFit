"use client";

import type { Ingredient } from "@/lib/supabase/types";

type Props = {
  ingredient?: Ingredient;
  action: (formData: FormData) => void | Promise<void>;
};

// Formulario de alta/edición de un ingrediente (precio + nutrición por 100 g).
export function IngredientForm({ ingredient, action }: Props) {
  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="name">
            Nombre
          </label>
          <input id="name" name="name" className="input" defaultValue={ingredient?.name} required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="purchase_unit">
              Unidad
            </label>
            <input
              id="purchase_unit"
              name="purchase_unit"
              className="input"
              placeholder="kg, unidad…"
              defaultValue={ingredient?.purchase_unit ?? "kg"}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="reference_price">
              Precio (S/)
            </label>
            <input
              id="reference_price"
              name="reference_price"
              type="number"
              step="0.01"
              min={0}
              className="input"
              defaultValue={ingredient?.reference_price ?? 0}
            />
          </div>
          <div>
            <label className="label" htmlFor="grams_per_unit">
              g / unidad
            </label>
            <input
              id="grams_per_unit"
              name="grams_per_unit"
              type="number"
              step="1"
              min={1}
              className="input"
              defaultValue={ingredient?.grams_per_unit ?? 1000}
            />
          </div>
        </div>
        <p className="text-xs text-stone-400">
          “g / unidad” convierte la unidad de compra a gramos (kg = 1000; 1 huevo ≈ 50).
        </p>
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-semibold text-stone-700">Nutrición por 100 g</p>
        <div className="grid grid-cols-2 gap-3">
          <Field name="kcal_per_100g" label="Calorías (kcal)" value={ingredient?.kcal_per_100g} />
          <Field name="protein_per_100g" label="Proteína (g)" value={ingredient?.protein_per_100g} />
          <Field name="carbs_per_100g" label="Carbohidratos (g)" value={ingredient?.carbs_per_100g} />
          <Field name="fat_per_100g" label="Grasa (g)" value={ingredient?.fat_per_100g} />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        {ingredient ? "Guardar cambios" : "Agregar ingrediente"}
      </button>
    </form>
  );
}

function Field({ name, label, value }: { name: string; label: string; value?: number }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        step="0.1"
        min={0}
        className="input"
        defaultValue={value ?? 0}
      />
    </div>
  );
}
