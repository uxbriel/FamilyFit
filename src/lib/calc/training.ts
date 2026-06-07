// =====================================================================
// Generador de rutina de gimnasio básica
// Solo se usa si el miembro marcó wants_gym = true. Devuelve una rutina
// acorde a su fase y objetivo. Plantillas simples y editables.
// =====================================================================

import type { Goal, Phase } from "./types";

export interface TrainingExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface TrainingDay {
  title: string;
  exercises: TrainingExercise[];
}

export interface TrainingPlan {
  daysPerWeek: number;
  focus: string;
  notes: string;
  days: TrainingDay[];
}

const FULL_BODY: TrainingDay[] = [
  {
    title: "Día A — Cuerpo completo",
    exercises: [
      { name: "Sentadilla", sets: 3, reps: "8-12" },
      { name: "Press de banca o flexiones", sets: 3, reps: "8-12" },
      { name: "Remo con barra", sets: 3, reps: "8-12" },
      { name: "Plancha abdominal", sets: 3, reps: "30-45 s" },
    ],
  },
  {
    title: "Día B — Cuerpo completo",
    exercises: [
      { name: "Peso muerto rumano", sets: 3, reps: "8-12" },
      { name: "Press militar", sets: 3, reps: "8-12" },
      { name: "Jalón al pecho", sets: 3, reps: "8-12" },
      { name: "Zancadas", sets: 3, reps: "10 por pierna" },
    ],
  },
];

const UPPER_LOWER: TrainingDay[] = [
  {
    title: "Día 1 — Tren superior",
    exercises: [
      { name: "Press de banca", sets: 4, reps: "6-10" },
      { name: "Remo con barra", sets: 4, reps: "6-10" },
      { name: "Press militar", sets: 3, reps: "8-12" },
      { name: "Curl de bíceps + extensión de tríceps", sets: 3, reps: "10-12" },
    ],
  },
  {
    title: "Día 2 — Tren inferior",
    exercises: [
      { name: "Sentadilla", sets: 4, reps: "6-10" },
      { name: "Peso muerto rumano", sets: 3, reps: "8-12" },
      { name: "Prensa de pierna", sets: 3, reps: "10-12" },
      { name: "Elevación de pantorrillas", sets: 4, reps: "12-15" },
    ],
  },
  {
    title: "Día 3 — Tren superior",
    exercises: [
      { name: "Press inclinado con mancuernas", sets: 4, reps: "8-12" },
      { name: "Jalón al pecho", sets: 4, reps: "8-12" },
      { name: "Elevaciones laterales", sets: 3, reps: "12-15" },
      { name: "Plancha abdominal", sets: 3, reps: "45 s" },
    ],
  },
  {
    title: "Día 4 — Tren inferior",
    exercises: [
      { name: "Sentadilla frontal", sets: 4, reps: "8-12" },
      { name: "Hip thrust", sets: 3, reps: "10-12" },
      { name: "Zancadas con mancuernas", sets: 3, reps: "10 por pierna" },
      { name: "Abdominales en polea o crunch", sets: 3, reps: "12-15" },
    ],
  },
];

/**
 * Genera la rutina según fase y objetivo.
 *  - Fase 1: full body 3x/sem, base técnica y fuerza general.
 *  - Fase 2 ganar masa: upper/lower 4x/sem, énfasis en sobrecarga.
 *  - Fase 2 bajar grasa: full body 3x/sem + recordatorio de cardio.
 *  - Fase 3: upper/lower 4x/sem para mantener, intensidad moderada.
 */
export function generateTrainingPlan(phase: Phase, goal: Goal): TrainingPlan {
  if (phase === "phase1") {
    return {
      daysPerWeek: 3,
      focus: "Base de fuerza y técnica (cuerpo completo)",
      notes: "3 sesiones por semana en días alternos. Prioriza la técnica antes que el peso. Descansa 60-90 s entre series.",
      days: FULL_BODY,
    };
  }

  if (phase === "phase2" && goal === "gain_muscle") {
    return {
      daysPerWeek: 4,
      focus: "Hipertrofia (torso/pierna)",
      notes: "4 sesiones por semana. Busca sobrecarga progresiva (sube peso o repeticiones cada semana). Descansa 90-120 s en básicos.",
      days: UPPER_LOWER,
    };
  }

  if (phase === "phase2") {
    return {
      daysPerWeek: 3,
      focus: "Mantener músculo en déficit (cuerpo completo)",
      notes: "3 sesiones de fuerza para conservar masa en déficit, más 2-3 sesiones de cardio ligero (caminata) por semana. Mantén las cargas.",
      days: FULL_BODY,
    };
  }

  // phase3
  return {
    daysPerWeek: 4,
    focus: "Mantenimiento y salud (torso/pierna)",
    notes: "4 sesiones por semana a intensidad moderada para sostener tus resultados a largo plazo. Disfruta el proceso.",
    days: UPPER_LOWER,
  };
}
