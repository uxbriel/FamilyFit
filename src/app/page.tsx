import Link from "next/link";
import { getFamily, getMembers, familyNeedsSeed, getFamilyFoodLogs } from "@/lib/data";
import { todayISO } from "@/lib/week";
import { computeEnergy } from "@/lib/calc/energy";
import { memberToInput } from "@/lib/calc/adapt";
import { MacroBar } from "@/components/MacroBar";
import { Disclaimer } from "@/components/Disclaimer";
import { AutoSeed } from "@/components/AutoSeed";
import { signOut } from "./login/actions";
import {
  BALANCE_LABELS,
  GOAL_LABELS,
  PHASE_SHORT,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [family, members, needsSeed, todayLogs] = await Promise.all([
    getFamily(),
    getMembers(),
    familyNeedsSeed(),
    getFamilyFoodLogs(todayISO()),
  ]);

  return (
    <main className="px-4 py-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-400">Familia</p>
          <h1 className="text-xl font-bold text-stone-800">
            {family?.name ?? "Mi familia"}
          </h1>
        </div>
        <form action={signOut}>
          <button className="btn-ghost text-xs">Salir</button>
        </form>
      </header>

      <div className="mb-4">
        <Disclaimer />
      </div>

      {needsSeed && <AutoSeed />}

      {members.length === 0 ? (
        <div className="card text-center">
          <p className="text-4xl">👋</p>
          <h2 className="mt-2 font-semibold">Empieza agregando a tu familia</h2>
          <p className="mt-1 text-sm text-stone-500">
            Registra a cada miembro con sus datos para calcular sus calorías y macros.
          </p>
          <Link href="/members/new" className="btn-primary mt-4">
            Agregar miembro
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const e = computeEnergy(memberToInput(m));
            return (
              <Link key={m.id} href={`/members/${m.id}`} className="card block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-stone-800">{m.name}</h3>
                    <p className="text-xs text-stone-500">
                      {GOAL_LABELS[m.goal]} · {PHASE_SHORT[m.active_phase]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-600">
                      {e.targetCalories}
                    </p>
                    <p className="text-xs text-stone-400">kcal/día</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="chip bg-stone-100 text-stone-600">
                    Mantenimiento {e.tdee} kcal
                  </span>
                  <span
                    className={`chip ${
                      e.balance === "deficit"
                        ? "bg-blue-100 text-blue-700"
                        : e.balance === "surplus"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {BALANCE_LABELS[e.balance]}
                    {e.calorieAdjustment !== 0 &&
                      ` ${Math.round(e.calorieAdjustment * 100)}%`}
                  </span>
                  {m.wants_gym && (
                    <span className="chip bg-brand-50 text-brand-600">🏋️ Gym</span>
                  )}
                </div>
                <div className="mt-3">
                  <MacroBar macros={e.macros} />
                </div>
                <TodayLine
                  logs={todayLogs.filter((l) => l.member_id === m.id)}
                  kcalTarget={e.targetCalories}
                  proteinTarget={e.macros.proteinG}
                />
              </Link>
            );
          })}

          <Link href="/members/new" className="btn-secondary w-full">
            + Agregar otro miembro
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/log" className="card col-span-2 text-center">
          <p className="text-2xl">📒</p>
          <p className="mt-1 text-sm font-medium">Diario: registra lo que comes</p>
        </Link>
        <Link href="/planner" className="card text-center">
          <p className="text-2xl">🍽️</p>
          <p className="mt-1 text-sm font-medium">Plan semanal y compras</p>
        </Link>
        <Link href="/dishes" className="card text-center">
          <p className="text-2xl">📖</p>
          <p className="mt-1 text-sm font-medium">Platos peruanos</p>
        </Link>
      </div>
    </main>
  );
}

function TodayLine({
  logs,
  kcalTarget,
  proteinTarget,
}: {
  logs: { kcal: number; protein_g: number }[];
  kcalTarget: number;
  proteinTarget: number;
}) {
  if (logs.length === 0) {
    return <p className="mt-2 text-xs text-stone-400">Hoy: nada registrado todavía</p>;
  }
  const kcal = Math.round(logs.reduce((s, l) => s + Number(l.kcal), 0));
  const protein = Math.round(logs.reduce((s, l) => s + Number(l.protein_g), 0));
  return (
    <p className="mt-2 text-xs text-stone-600">
      Hoy: <span className="font-semibold">{kcal}</span> / {kcalTarget} kcal · proteína{" "}
      <span className="font-semibold">{protein}</span> / {proteinTarget} g
    </p>
  );
}
