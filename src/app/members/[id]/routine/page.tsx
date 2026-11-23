import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getMember, getWorkoutDays } from "@/lib/data";
import { exercisesToText } from "@/lib/calc/routine";
import { DAY_LABELS, WORKOUT_KIND_LABELS } from "@/lib/labels";
import { dayIndexMondayFirst, todayISO } from "@/lib/week";
import type { WorkoutKind } from "@/lib/supabase/types";
import { clearRoutine, loadRoutineTemplate, saveRoutine } from "./actions";

export const dynamic = "force-dynamic";

const KINDS: WorkoutKind[] = ["strength", "cardio", "rest"];

export default async function RoutinePage({ params }: { params: { id: string } }) {
  const [member, days] = await Promise.all([getMember(params.id), getWorkoutDays(params.id)]);
  if (!member) notFound();

  const byDay = new Map(days.map((d) => [d.day_of_week, d]));
  const today = dayIndexMondayFirst(todayISO());

  return (
    <main className="px-4 py-3">
      <PageHeader title={`Rutina de ${member.name}`} back={`/members/${member.id}`} />

      <div className="card mb-3 space-y-2">
        <p className="text-sm font-semibold text-stone-700">Cargar una rutina de partida</p>
        <p className="text-xs text-stone-500">
          Reemplaza los 7 días. Después la editas como quieras.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <form action={loadRoutineTemplate.bind(null, member.id, "shoulders")}>
            <button className="btn-secondary w-full text-xs">Prioridad hombros + abs</button>
          </form>
          <form action={loadRoutineTemplate.bind(null, member.id, "phase")}>
            <button className="btn-secondary w-full text-xs">Según mi fase</button>
          </form>
        </div>
      </div>

      <form action={saveRoutine.bind(null, member.id)} className="space-y-3">
        {DAY_LABELS.map((label, day) => {
          const d = byDay.get(day);
          return (
            <div
              key={day}
              className={`card space-y-2 ${day === today ? "border-brand-300" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-stone-700">
                  {label}
                  {day === today && <span className="ml-1 chip bg-brand-50 text-brand-600">hoy</span>}
                </p>
                <select
                  name={`kind_${day}`}
                  className="input w-32 py-1.5 text-sm"
                  defaultValue={d?.kind ?? "rest"}
                  aria-label={`Tipo de día ${label}`}
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {WORKOUT_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                name={`title_${day}`}
                className="input text-sm"
                placeholder="Título (ej. Hombros + abs)"
                defaultValue={d?.title ?? ""}
                aria-label={`Título ${label}`}
              />
              <textarea
                name={`exercises_${day}`}
                className="input min-h-[96px] font-mono text-xs"
                placeholder={"Press militar | 4 | 8-12\nElevaciones laterales | 3 | 12-15"}
                defaultValue={d ? exercisesToText(d.exercises) : ""}
                aria-label={`Ejercicios ${label}`}
              />
              <input
                name={`notes_${day}`}
                className="input text-sm"
                placeholder="Notas (opcional)"
                defaultValue={d?.notes ?? ""}
                aria-label={`Notas ${label}`}
              />
            </div>
          );
        })}
        <p className="text-xs text-stone-400">
          Un ejercicio por línea: <span className="font-mono">nombre | series | reps</span>. Si
          omites series o reps se usa 3 × 8-12.
        </p>
        <button className="btn-primary w-full">Guardar rutina</button>
      </form>

      {days.length > 0 && (
        <div className="mt-3">
          <DeleteButton
            action={clearRoutine.bind(null, member.id)}
            label="Borrar rutina personalizada"
            confirmText="¿Borrar la rutina personalizada? Volverás a ver la plantilla automática."
          />
        </div>
      )}
    </main>
  );
}
