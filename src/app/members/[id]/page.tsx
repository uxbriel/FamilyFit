import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { MacroBar } from "@/components/MacroBar";
import { DeleteMemberButton } from "@/components/DeleteMemberButton";
import { Disclaimer } from "@/components/Disclaimer";
import { getMember } from "@/lib/data";
import { computeEnergy } from "@/lib/calc/energy";
import { generateTrainingPlan } from "@/lib/calc/training";
import { memberToInput } from "@/lib/calc/adapt";
import {
  BALANCE_LABELS,
  GOAL_LABELS,
  NEAT_LABELS,
  PHASE_DESC,
  PHASE_LABELS,
  SEX_LABELS,
} from "@/lib/labels";
import type { Phase } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const PHASES: Phase[] = ["phase1", "phase2", "phase3"];

export default async function MemberDetail({ params }: { params: { id: string } }) {
  const member = await getMember(params.id);
  if (!member) notFound();

  const input = memberToInput(member);
  const e = computeEnergy(input);

  return (
    <main className="px-4 py-3">
      <PageHeader
        title={member.name}
        back="/members"
        action={
          <Link href={`/members/${member.id}/edit`} className="btn-ghost text-sm">
            Editar
          </Link>
        }
      />

      {/* Resumen */}
      <div className="card mb-3">
        <p className="text-sm text-stone-500">
          {member.age} años · {SEX_LABELS[member.sex]} · {Number(member.weight_kg)} kg ·{" "}
          {Number(member.height_cm)} cm
        </p>
        <p className="mt-1 text-sm text-stone-500">
          NEAT: {NEAT_LABELS[member.neat_level]}
          {member.sport_type
            ? ` · ${member.sport_type} ${member.sport_freq_per_week}x/sem`
            : ""}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-stone-400">Objetivo del día</p>
            <p className="text-3xl font-bold text-brand-600">{e.targetCalories}</p>
            <p className="text-xs text-stone-400">kcal · {GOAL_LABELS[member.goal]}</p>
          </div>
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
            {e.calorieAdjustment !== 0 && ` ${Math.round(e.calorieAdjustment * 100)}%`}
          </span>
        </div>
        <div className="mt-3">
          <MacroBar macros={e.macros} />
        </div>
      </div>

      {/* Cálculo energético */}
      <div className="card mb-3">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">Cálculo energético</h2>
        <dl className="divide-y divide-stone-100 text-sm">
          <Row label="BMR (Mifflin-St Jeor)" value={`${e.bmr} kcal`} />
          <Row label="Factor de actividad" value={`× ${e.activityFactor}`} />
          <Row label="TDEE (mantenimiento)" value={`${e.tdee} kcal`} />
          <Row
            label="Ajuste por fase"
            value={
              e.calorieAdjustment === 0
                ? "0% (mantenimiento)"
                : `${Math.round(e.calorieAdjustment * 100)}%`
            }
          />
          <Row label="Objetivo diario" value={`${e.targetCalories} kcal`} strong />
        </dl>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Macro label="Proteína" g={e.macros.proteinG} pct={e.macros.proteinPct} />
          <Macro label="Carbohid." g={e.macros.carbsG} pct={e.macros.carbsPct} />
          <Macro label="Grasa" g={e.macros.fatG} pct={e.macros.fatPct} />
        </div>
      </div>

      {/* Las 3 fases */}
      <div className="card mb-3">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">Las 3 fases</h2>
        <div className="space-y-2">
          {PHASES.map((phase) => {
            const pe = computeEnergy({ ...input, activePhase: phase });
            const active = phase === member.active_phase;
            return (
              <div
                key={phase}
                className={`rounded-xl border p-3 ${
                  active ? "border-brand-300 bg-brand-50" : "border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{PHASE_LABELS[phase]}</p>
                  {active && (
                    <span className="chip bg-brand-500 text-white">Activa</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-500">{PHASE_DESC[phase]}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="chip bg-white text-stone-700">
                    {pe.targetCalories} kcal
                  </span>
                  <span className="chip bg-white text-stone-700">
                    {pe.calorieAdjustment === 0
                      ? "mantenimiento"
                      : `${Math.round(pe.calorieAdjustment * 100)}%`}
                  </span>
                  <span className="chip bg-white text-stone-700">
                    P {pe.macros.proteinG} / C {pe.macros.carbsG} / G {pe.macros.fatG}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rutina de gimnasio */}
      {member.wants_gym && (
        <div className="card mb-3">
          <TrainingSection
            plan={generateTrainingPlan(member.active_phase, member.goal)}
          />
        </div>
      )}

      <div className="mb-3">
        <Disclaimer compact />
      </div>

      <DeleteMemberButton id={member.id} name={member.name} />
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between py-1.5">
      <dt className="text-stone-500">{label}</dt>
      <dd className={strong ? "font-bold text-brand-600" : "font-medium"}>{value}</dd>
    </div>
  );
}

function Macro({ label, g, pct }: { label: string; g: number; pct: number }) {
  return (
    <div className="rounded-xl bg-stone-50 p-2">
      <p className="text-stone-500">{label}</p>
      <p className="font-bold text-stone-800">{g} g</p>
      <p className="text-stone-400">{pct}%</p>
    </div>
  );
}

function TrainingSection({
  plan,
}: {
  plan: ReturnType<typeof generateTrainingPlan>;
}) {
  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-stone-700">
        🏋️ Rutina de gimnasio
      </h2>
      <p className="text-xs text-stone-500">
        {plan.focus} · {plan.daysPerWeek} días/semana
      </p>
      <p className="mt-1 text-xs text-stone-500">{plan.notes}</p>
      <div className="mt-3 space-y-3">
        {plan.days.map((day) => (
          <div key={day.title}>
            <p className="text-sm font-semibold text-stone-700">{day.title}</p>
            <ul className="mt-1 space-y-1 text-sm">
              {day.exercises.map((ex) => (
                <li key={ex.name} className="flex justify-between">
                  <span className="text-stone-600">{ex.name}</span>
                  <span className="text-stone-400">
                    {ex.sets} × {ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
