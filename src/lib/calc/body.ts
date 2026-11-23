// =====================================================================
// Composición corporal: masa magra, BMR por masa magra y meta.
// Funciones puras y testeables.
// =====================================================================

/** Masa libre de grasa (kg) a partir del peso y el % de grasa. */
export function leanMassKg(weightKg: number, bodyFatPct: number): number {
  return round(weightKg * (1 - bodyFatPct / 100), 1);
}

/** Grasa corporal en kg. */
export function fatMassKg(weightKg: number, bodyFatPct: number): number {
  return round((weightKg * bodyFatPct) / 100, 1);
}

/**
 * BMR con Katch-McArdle (usa la masa magra, más preciso que Mifflin
 * cuando se conoce el % de grasa): 370 + 21.6 × masa magra (kg).
 */
export function katchMcArdleBMR(leanKg: number): number {
  return Math.round(370 + 21.6 * leanKg);
}

export interface BodyGoalProgress {
  currentLeanKg: number;
  currentFatKg: number;
  targetLeanKg: number;
  targetFatKg: number;
  /** Positivo = músculo a ganar; negativo = masa magra que sobra. */
  leanToGainKg: number;
  /** Positivo = grasa a perder; negativo = grasa que se puede subir. */
  fatToLoseKg: number;
  weightChangeKg: number;
  /** Meses estimados: ~2 kg de grasa/mes en corte + ~0.5 kg de músculo/mes en volumen. */
  estimatedMonths: number;
}

/** Cuánto músculo ganar y cuánta grasa perder para llegar a la meta. */
export function bodyGoalProgress(
  weightKg: number,
  bodyFatPct: number,
  targetWeightKg: number,
  targetBodyFatPct: number,
  leanGainPerMonthKg = 0.5,
): BodyGoalProgress {
  const currentLeanKg = leanMassKg(weightKg, bodyFatPct);
  const currentFatKg = fatMassKg(weightKg, bodyFatPct);
  const targetLeanKg = leanMassKg(targetWeightKg, targetBodyFatPct);
  const targetFatKg = fatMassKg(targetWeightKg, targetBodyFatPct);
  const leanToGainKg = round(targetLeanKg - currentLeanKg, 1);
  const fatToLoseKg = round(currentFatKg - targetFatKg, 1);
  // Corte y volumen van en fases separadas: se suman los dos tiempos.
  const leanMonths = leanToGainKg > 0 ? leanToGainKg / leanGainPerMonthKg : 0;
  const fatMonths = fatToLoseKg > 0 ? fatToLoseKg / 2 : 0; // ~2 kg grasa/mes
  return {
    currentLeanKg,
    currentFatKg,
    targetLeanKg,
    targetFatKg,
    leanToGainKg,
    fatToLoseKg,
    weightChangeKg: round(targetWeightKg - weightKg, 1),
    estimatedMonths: Math.ceil(leanMonths + fatMonths),
  };
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
