// Etiquetas legibles en español para los enums del dominio.
import type { Goal, MealType, NeatLevel, Phase, Sex } from "./supabase/types";

export const SEX_LABELS: Record<Sex, string> = {
  male: "Hombre",
  female: "Mujer",
};

export const NEAT_LABELS: Record<NeatLevel, string> = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  active: "Activo",
};

export const NEAT_HELP: Record<NeatLevel, string> = {
  sedentary: "Trabajo de oficina, poco movimiento",
  light: "Camina algo / tareas ligeras",
  moderate: "De pie o caminando buena parte del día",
  active: "Trabajo físico o muy activo",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose_fat: "Bajar grasa",
  gain_muscle: "Ganar masa muscular",
  recomp: "Recomposición",
  maintain: "Mantenerse",
};

export const PHASE_LABELS: Record<Phase, string> = {
  phase1: "Fase 1 — Recomposición",
  phase2: "Fase 2 — Ajuste",
  phase3: "Fase 3 — Mantenimiento",
};

export const PHASE_SHORT: Record<Phase, string> = {
  phase1: "Fase 1",
  phase2: "Fase 2",
  phase3: "Fase 3",
};

export const PHASE_DESC: Record<Phase, string> = {
  phase1: "Mantenimiento o déficit ligero (~ -10%). Mejora la composición corporal con proteína alta sin perder energía.",
  phase2: "Déficit marcado (-15/-20%) para bajar grasa, o superávit ligero (+10%) para ganar masa muscular.",
  phase3: "Calorías de mantenimiento. Hábitos estables a largo plazo, energía y proporción corporal saludable.",
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

export const BALANCE_LABELS: Record<"deficit" | "maintenance" | "surplus", string> = {
  deficit: "Déficit",
  maintenance: "Mantenimiento",
  surplus: "Superávit",
};

export const DAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
