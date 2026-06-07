"use client";

import { useTransition } from "react";
import { setPlanEntry } from "@/app/planner/actions";
import { DAY_LABELS, MEAL_LABELS } from "@/lib/labels";
import type { MealType } from "@/lib/supabase/types";

interface DishOption {
  id: string;
  name: string;
  mealType: MealType;
}

interface EntryRef {
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
}

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

// Grilla editable: por cada día y comida, elige un plato. Cada cambio se
// guarda al instante mediante una server action.
export function PlanGrid({
  weekStart,
  dishes,
  entries,
}: {
  weekStart: string;
  dishes: DishOption[];
  entries: EntryRef[];
}) {
  const [isPending, startTransition] = useTransition();

  const current = (day: number, meal: MealType) =>
    entries.find((e) => e.dayOfWeek === day && e.mealType === meal)?.dishId ?? "";

  function change(day: number, meal: MealType, dishId: string) {
    startTransition(() => {
      setPlanEntry(weekStart, day, meal, dishId);
    });
  }

  return (
    <div className={`space-y-3 ${isPending ? "opacity-60" : ""}`}>
      {DAY_LABELS.map((dayLabel, day) => (
        <div key={day} className="card">
          <p className="mb-2 text-sm font-semibold text-stone-700">{dayLabel}</p>
          <div className="space-y-2">
            {MEALS.map((meal) => (
              <div key={meal} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-stone-500">
                  {MEAL_LABELS[meal]}
                </span>
                <select
                  className="input py-1.5 text-sm"
                  value={current(day, meal)}
                  onChange={(e) => change(day, meal, e.target.value)}
                >
                  <option value="">—</option>
                  {dishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
