import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getMeasurements, getMember } from "@/lib/data";
import { bodyGoalProgress, fatMassKg, leanMassKg } from "@/lib/calc/body";
import { dayLabel, todayISO } from "@/lib/week";
import { addMeasurement, deleteMeasurement, updateBodyGoal } from "./actions";

export const dynamic = "force-dynamic";

export default async function BodyPage({ params }: { params: { id: string } }) {
  const [member, measurements] = await Promise.all([
    getMember(params.id),
    getMeasurements(params.id),
  ]);
  if (!member) notFound();

  const weight = Number(member.weight_kg);
  const bf = member.body_fat_pct == null ? null : Number(member.body_fat_pct);
  const targetW = member.target_weight_kg == null ? null : Number(member.target_weight_kg);
  const targetBf =
    member.target_body_fat_pct == null ? null : Number(member.target_body_fat_pct);
  const goal =
    bf != null && targetW != null && targetBf != null
      ? bodyGoalProgress(weight, bf, targetW, targetBf)
      : null;

  return (
    <main className="px-4 py-3">
      <PageHeader title="Composición corporal" back={`/members/${member.id}`} />

      {/* Estado actual */}
      <div className="card mb-3">
        <p className="text-xs text-stone-400">{member.name} · último dato</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Stat label="Peso" value={`${weight} kg`} />
          <Stat label="% grasa" value={bf != null ? `${bf}%` : "—"} />
          <Stat label="Masa magra" value={bf != null ? `${leanMassKg(weight, bf)} kg` : "—"} />
        </div>
        {bf == null && (
          <p className="mt-2 text-xs text-stone-500">
            Registra tu % de grasa para calcular las calorías con tu masa magra
            (Katch-McArdle), que es más preciso.
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="card mb-3">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">🎯 Meta</h2>
        {goal && (
          <div className="mb-3 space-y-1 text-sm">
            <GoalRow
              label="Músculo (masa magra)"
              value={
                goal.leanToGainKg > 0
                  ? `+${goal.leanToGainKg} kg por ganar`
                  : "Ya llegaste ✅"
              }
              hint={`${goal.currentLeanKg} → ${goal.targetLeanKg} kg`}
            />
            <GoalRow
              label="Grasa"
              value={
                goal.fatToLoseKg > 0 ? `−${goal.fatToLoseKg} kg por perder` : "Ya llegaste ✅"
              }
              hint={`${fatMassKg(weight, bf as number)} → ${goal.targetFatKg} kg`}
            />
            <GoalRow
              label="Tiempo estimado"
              value={goal.estimatedMonths > 0 ? `~${goal.estimatedMonths} meses` : "—"}
              hint="corte (~2 kg grasa/mes) + volumen (~0.5 kg músculo/mes)"
            />
          </div>
        )}
        <form action={updateBodyGoal.bind(null, member.id)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumField name="target_weight_kg" label="Peso meta (kg)" value={targetW} step="0.1" />
            <NumField
              name="target_body_fat_pct"
              label="% grasa meta"
              value={targetBf}
              step="0.1"
            />
          </div>
          <button className="btn-secondary w-full">Guardar meta</button>
        </form>
      </div>

      {/* Nueva medición */}
      <div className="card mb-3">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">⚖️ Nueva medición</h2>
        <form action={addMeasurement.bind(null, member.id)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="measured_on">
                Fecha
              </label>
              <input
                id="measured_on"
                name="measured_on"
                type="date"
                className="input"
                defaultValue={todayISO()}
                required
              />
            </div>
            <NumField name="weight_kg" label="Peso (kg)" step="0.1" required />
            <NumField name="body_fat_pct" label="% grasa" step="0.1" />
            <NumField name="muscle_mass_kg" label="Masa muscular (kg)" step="0.1" />
            <NumField name="visceral_fat" label="Grasa visceral" step="0.5" />
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Notas
            </label>
            <input id="notes" name="notes" className="input" placeholder="En ayunas, 6:30 am…" />
          </div>
          <button className="btn-primary w-full">Guardar medición</button>
          <p className="text-xs text-stone-400">
            Mídete siempre en las mismas condiciones (en ayunas, después del baño). Las
            balanzas de bioimpedancia sirven para ver la tendencia, no el valor exacto.
          </p>
        </form>
      </div>

      {/* Historial */}
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">Historial</h2>
        {measurements.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no hay mediciones.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {measurements.map((m, idx) => {
              const prev = measurements[idx + 1];
              const delta = prev ? Number(m.weight_kg) - Number(prev.weight_kg) : null;
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="text-sm">
                    <p className="font-medium text-stone-700">
                      {Number(m.weight_kg)} kg
                      {delta != null && delta !== 0 && (
                        <span
                          className={`ml-1 text-xs ${delta < 0 ? "text-blue-600" : "text-emerald-600"}`}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(1)}
                        </span>
                      )}
                      {m.body_fat_pct != null && (
                        <span className="text-stone-500"> · {Number(m.body_fat_pct)}%</span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400">
                      {dayLabel(m.measured_on)}
                      {m.muscle_mass_kg != null && ` · músculo ${Number(m.muscle_mass_kg)} kg`}
                      {m.visceral_fat != null && ` · visceral ${Number(m.visceral_fat)}`}
                      {m.notes && ` · ${m.notes}`}
                    </p>
                  </div>
                  <div className="w-20">
                    <DeleteButton
                      action={deleteMeasurement.bind(null, member.id, m.id)}
                      label="Borrar"
                      confirmText="¿Borrar esta medición?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-50 p-2">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="font-bold text-stone-800">{value}</p>
    </div>
  );
}

function GoalRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-stone-600">{label}</p>
        <p className="text-xs text-stone-400">{hint}</p>
      </div>
      <p className="text-right font-semibold text-stone-800">{value}</p>
    </div>
  );
}

function NumField({
  name,
  label,
  value,
  step = "1",
  required,
}: {
  name: string;
  label: string;
  value?: number | null;
  step?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        className="input"
        defaultValue={value ?? undefined}
        required={required}
      />
    </div>
  );
}
