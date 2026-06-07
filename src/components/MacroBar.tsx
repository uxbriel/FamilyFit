import type { Macros } from "@/lib/calc/types";

// Barra visual con la proporción de macros + gramos.
export function MacroBar({ macros }: { macros: Macros }) {
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div className="bg-rose-400" style={{ width: `${macros.proteinPct}%` }} />
        <div className="bg-amber-400" style={{ width: `${macros.carbsPct}%` }} />
        <div className="bg-sky-400" style={{ width: `${macros.fatPct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-stone-600">
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-rose-400 align-middle" />{" "}
          Prot {macros.proteinG} g
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" />{" "}
          Carb {macros.carbsG} g
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400 align-middle" />{" "}
          Grasa {macros.fatG} g
        </span>
      </div>
    </div>
  );
}
