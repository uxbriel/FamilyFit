// =====================================================================
// Rutina personalizada: ejercicios escritos como texto, una línea cada uno.
//   "Press militar | 4 | 8-12"
//   "Elevaciones laterales | 3 | 12-15 al fallo"
// Si faltan series o reps se usan 3 y "8-12". Funciones puras.
// =====================================================================

export interface RoutineExercise {
  name: string;
  sets: number;
  reps: string;
}

export function parseExercises(text: string): RoutineExercise[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName, rawSets, ...rest] = line.split("|").map((p) => p.trim());
      const sets = Number.parseInt(rawSets ?? "", 10);
      const reps = rest.join(" | ").trim();
      return {
        name: rawName.replace(/^[-•*]\s*/, ""),
        sets: Number.isFinite(sets) && sets > 0 ? Math.min(sets, 20) : 3,
        reps: reps || "8-12",
      };
    })
    .filter((e) => e.name.length > 0);
}

export function exercisesToText(exercises: RoutineExercise[]): string {
  return exercises.map((e) => `${e.name} | ${e.sets} | ${e.reps}`).join("\n");
}

// --------------------------------------------------------------------
// Rutinas de partida (editables después de cargarlas)
// --------------------------------------------------------------------

export type RoutineKind = "strength" | "cardio" | "rest";

export interface RoutineDayTemplate {
  dayOfWeek: number; // 0 = lunes
  kind: RoutineKind;
  title: string;
  notes?: string;
  exercises: RoutineExercise[];
}

const FAILURE_NOTE = "Lleva solo la última serie de cada ejercicio al fallo; deja 1-2 reps en reserva en las demás.";

const SHOULDERS_DAY: Omit<RoutineDayTemplate, "dayOfWeek"> = {
  kind: "strength",
  title: "Hombros + abs + espalda",
  notes: FAILURE_NOTE,
  exercises: [
    { name: "Press militar con mancuernas", sets: 4, reps: "8-12" },
    { name: "Elevaciones laterales", sets: 4, reps: "12-15" },
    { name: "Pájaros (deltoide posterior)", sets: 3, reps: "12-15" },
    { name: "Dominadas o remo con mancuerna", sets: 3, reps: "6-10" },
    { name: "Crunch con peso o en polea", sets: 3, reps: "10-15" },
    { name: "Elevación de piernas colgado", sets: 3, reps: "10-15" },
  ],
};

const ARMS_DAY: Omit<RoutineDayTemplate, "dayOfWeek"> = {
  kind: "strength",
  title: "Bíceps + tríceps + pecho + pierna",
  notes: FAILURE_NOTE,
  exercises: [
    { name: "Fondos o flexiones", sets: 3, reps: "8-15" },
    { name: "Curl con mancuernas", sets: 3, reps: "8-12" },
    { name: "Curl martillo", sets: 3, reps: "10-12" },
    { name: "Extensión de tríceps sobre la cabeza", sets: 3, reps: "10-12" },
    { name: "Zancadas con chaleco", sets: 3, reps: "10 por pierna" },
  ],
};

const VEST_WALK: Omit<RoutineDayTemplate, "dayOfWeek"> = {
  kind: "cardio",
  title: "Caminata con chaleco cuesta arriba",
  notes: "Chaleco de 10 kg. Ritmo en el que puedas hablar con esfuerzo.",
  exercises: [{ name: "Caminata cuesta arriba con chaleco 10 kg", sets: 1, reps: "30-40 min" }],
};

/** Prioridad hombros y abs, sin descuidar espalda, pecho y pierna. */
export const SHOULDER_FOCUS_ROUTINE: RoutineDayTemplate[] = [
  { dayOfWeek: 0, ...SHOULDERS_DAY },
  { dayOfWeek: 1, ...VEST_WALK },
  { dayOfWeek: 2, ...ARMS_DAY },
  { dayOfWeek: 3, ...SHOULDERS_DAY },
  { dayOfWeek: 4, ...VEST_WALK },
  { dayOfWeek: 5, ...ARMS_DAY },
  { dayOfWeek: 6, kind: "rest", title: "Descanso", exercises: [] },
];

const SESSION_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
};

/**
 * Convierte una plantilla de N sesiones (p.ej. full body A/B 3x/sem)
 * en una semana de lunes a domingo, alternando los días de la plantilla.
 */
export function weekFromSessions(
  sessions: { title: string; exercises: RoutineExercise[] }[],
  daysPerWeek: number,
  notes?: string,
): RoutineDayTemplate[] {
  const trainingDays = SESSION_DAYS[daysPerWeek] ?? SESSION_DAYS[3];
  return Array.from({ length: 7 }, (_, day) => {
    const slot = trainingDays.indexOf(day);
    if (slot === -1 || sessions.length === 0) {
      return { dayOfWeek: day, kind: "rest" as const, title: "Descanso", exercises: [] };
    }
    const s = sessions[slot % sessions.length];
    return { dayOfWeek: day, kind: "strength" as const, title: s.title, notes, exercises: s.exercises };
  });
}
