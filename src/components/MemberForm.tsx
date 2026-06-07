"use client";

import { useState } from "react";
import type { Member } from "@/lib/supabase/types";
import {
  GOAL_LABELS,
  NEAT_HELP,
  NEAT_LABELS,
  PHASE_DESC,
  PHASE_LABELS,
  SEX_LABELS,
} from "@/lib/labels";

type Props = {
  member?: Member;
  action: (formData: FormData) => void | Promise<void>;
};

// Formulario de alta/edición de un miembro (mobile-first).
export function MemberForm({ member, action }: Props) {
  const [phase, setPhase] = useState(member?.active_phase ?? "phase1");

  return (
    <form action={action} className="space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            className="input"
            defaultValue={member?.name}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="age">
              Edad
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={1}
              max={120}
              className="input"
              defaultValue={member?.age}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="sex">
              Sexo
            </label>
            <select id="sex" name="sex" className="input" defaultValue={member?.sex ?? "male"}>
              {Object.entries(SEX_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="weight_kg">
              Peso (kg)
            </label>
            <input
              id="weight_kg"
              name="weight_kg"
              type="number"
              step="0.1"
              min={1}
              className="input"
              defaultValue={member?.weight_kg}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="height_cm">
              Estatura (cm)
            </label>
            <input
              id="height_cm"
              name="height_cm"
              type="number"
              step="0.1"
              min={1}
              className="input"
              defaultValue={member?.height_cm}
              required
            />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-semibold text-stone-700">Actividad</p>
        <div>
          <label className="label" htmlFor="neat_level">
            Nivel de actividad diaria (NEAT)
          </label>
          <select
            id="neat_level"
            name="neat_level"
            className="input"
            defaultValue={member?.neat_level ?? "light"}
          >
            {Object.entries(NEAT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l} — {NEAT_HELP[v as keyof typeof NEAT_HELP]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="sport_type">
              Deporte (opcional)
            </label>
            <input
              id="sport_type"
              name="sport_type"
              className="input"
              placeholder="Fútbol, natación…"
              defaultValue={member?.sport_type ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="sport_freq_per_week">
              Veces por semana
            </label>
            <input
              id="sport_freq_per_week"
              name="sport_freq_per_week"
              type="number"
              min={0}
              max={14}
              className="input"
              defaultValue={member?.sport_freq_per_week ?? 0}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="wants_gym"
            defaultChecked={member?.wants_gym}
            className="h-4 w-4 rounded border-stone-300"
          />
          Quiere entrenar en gimnasio (genera rutina)
        </label>
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-semibold text-stone-700">Objetivo y fase</p>
        <div>
          <label className="label" htmlFor="goal">
            Objetivo de salud
          </label>
          <select id="goal" name="goal" className="input" defaultValue={member?.goal ?? "recomp"}>
            {Object.entries(GOAL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="active_phase">
            Fase activa
          </label>
          <select
            id="active_phase"
            name="active_phase"
            className="input"
            value={phase}
            onChange={(e) => setPhase(e.target.value as typeof phase)}
          >
            {Object.entries(PHASE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-stone-500">{PHASE_DESC[phase]}</p>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        {member ? "Guardar cambios" : "Agregar miembro"}
      </button>
    </form>
  );
}
