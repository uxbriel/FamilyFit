// =====================================================================
// Motor de cálculo energético
// BMR (Mifflin-St Jeor) → TDEE → fase → calorías objetivo → macros.
// Funciones puras: sin dependencias de React ni de la base de datos.
// =====================================================================

import type {
  EnergyResult,
  Goal,
  Macros,
  MemberInput,
  NeatLevel,
  Phase,
} from "./types";
import { katchMcArdleBMR, leanMassKg } from "./body";

/** Factor de actividad base según el nivel NEAT (vida cotidiana). */
const NEAT_FACTORS: Record<NeatLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/**
 * BMR con la fórmula de Mifflin-St Jeor.
 *   Hombres: 10·peso + 6.25·altura − 5·edad + 5
 *   Mujeres: 10·peso + 6.25·altura − 5·edad − 161
 */
export function calcBMR(input: Pick<MemberInput, "weightKg" | "heightCm" | "age" | "sex">): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  const sexOffset = input.sex === "male" ? 5 : -161;
  return round(base + sexOffset);
}

/**
 * Factor de actividad total = NEAT + aporte del deporte.
 * Cada sesión semanal de deporte suma ~0.025 al factor, con tope para
 * no sobreestimar el gasto (máximo +0.15 ≈ 6 sesiones).
 */
export function calcActivityFactor(neatLevel: NeatLevel, sportFreqPerWeek: number): number {
  const neat = NEAT_FACTORS[neatLevel];
  const sportBonus = Math.min(Math.max(sportFreqPerWeek, 0), 6) * 0.025;
  return round(neat + sportBonus, 3);
}

/** TDEE (calorías de mantenimiento) = BMR × factor de actividad. */
export function calcTDEE(bmr: number, activityFactor: number): number {
  return round(bmr * activityFactor);
}

/**
 * Ajuste calórico según la fase activa y el objetivo del miembro.
 * Devuelve una fracción: -0.15 = déficit 15%, +0.10 = superávit 10%.
 *
 *  Fase 1 — Recomposición: mantenimiento o déficit ligero (~ -10%).
 *  Fase 2 — Ajuste: déficit -15/-20% (bajar grasa) o superávit +10% (ganar masa).
 *  Fase 3 — Mantenimiento sostenible: 0%.
 */
export function calcCalorieAdjustment(phase: Phase, goal: Goal): number {
  switch (phase) {
    case "phase1":
      // Recomposición: déficit ligero salvo que la meta sea ganar masa.
      return goal === "gain_muscle" ? 0 : -0.1;
    case "phase2":
      if (goal === "lose_fat") return -0.2;
      if (goal === "gain_muscle") return 0.1;
      if (goal === "recomp") return -0.15;
      return 0; // maintain
    case "phase3":
      return 0;
  }
}

/** Etiqueta de balance a partir del ajuste calórico. */
export function balanceLabel(adjustment: number): EnergyResult["balance"] {
  if (adjustment < 0) return "deficit";
  if (adjustment > 0) return "surplus";
  return "maintenance";
}

/**
 * Macros diarios.
 *  - Proteína priorizada por peso corporal (g/kg) según fase/objetivo.
 *  - Grasa: % mínimo saludable de las calorías (con piso por g/kg).
 *  - Carbohidratos: las calorías restantes.
 */
export function calcMacros(
  targetCalories: number,
  weightKg: number,
  phase: Phase,
  goal: Goal,
): Macros {
  // Proteína g/kg: más alta en déficit/recomposición para preservar músculo.
  const proteinPerKg = proteinTargetPerKg(phase, goal);
  const proteinG = round(proteinPerKg * weightKg);

  // Grasa: 25% de las calorías, con piso saludable de 0.8 g/kg.
  const fatFromPct = (targetCalories * 0.25) / 9;
  const fatFloor = 0.8 * weightKg;
  const fatG = round(Math.max(fatFromPct, fatFloor));

  // Carbohidratos: el resto de las calorías (mínimo 0).
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const carbsG = round(carbsKcal / 4);

  const totalKcal = proteinKcal + fatKcal + carbsG * 4 || 1;
  return {
    proteinG,
    carbsG,
    fatG,
    proteinPct: round((proteinKcal / totalKcal) * 100, 1),
    carbsPct: round(((carbsG * 4) / totalKcal) * 100, 1),
    fatPct: round((fatKcal / totalKcal) * 100, 1),
  };
}

/** Proteína objetivo en g/kg de peso corporal (rango ~1.6–2.2). */
function proteinTargetPerKg(phase: Phase, goal: Goal): number {
  if (goal === "lose_fat") return 2.2; // máximo en déficit marcado
  if (phase === "phase1" || goal === "recomp") return 2.0;
  if (goal === "gain_muscle") return 1.8;
  return 1.6; // mantenimiento
}

/** Cálculo energético completo de un miembro. */
export function computeEnergy(member: MemberInput): EnergyResult {
  const hasBodyFat = member.bodyFatPct != null && member.bodyFatPct > 0;
  const bmr = hasBodyFat
    ? katchMcArdleBMR(leanMassKg(member.weightKg, member.bodyFatPct as number))
    : calcBMR(member);
  const activityFactor = calcActivityFactor(member.neatLevel, member.sportFreqPerWeek);
  const tdee = calcTDEE(bmr, activityFactor);
  const calorieAdjustment = calcCalorieAdjustment(member.activePhase, member.goal);
  const targetCalories = round(tdee * (1 + calorieAdjustment));
  const macros = calcMacros(targetCalories, member.weightKg, member.activePhase, member.goal);

  return {
    bmr,
    bmrFormula: hasBodyFat ? "katch" : "mifflin",
    activityFactor,
    tdee,
    calorieAdjustment,
    targetCalories,
    balance: balanceLabel(calorieAdjustment),
    macros,
  };
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
