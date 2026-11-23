import { describe, expect, it } from "vitest";
import { bodyGoalProgress, fatMassKg, katchMcArdleBMR, leanMassKg } from "./body";
import { computeEnergy } from "./energy";
import {
  nutritionForGrams,
  progressPct,
  remainingNutrition,
  scaleNutrition,
  sumNutrition,
} from "./log";
import {
  SHOULDER_FOCUS_ROUTINE,
  exercisesToText,
  parseExercises,
  weekFromSessions,
} from "./routine";
import type { MemberInput } from "./types";

describe("composición corporal", () => {
  it("calcula masa magra y grasa", () => {
    expect(leanMassKg(72.3, 18.3)).toBe(59.1);
    expect(fatMassKg(72.3, 18.3)).toBe(13.2);
  });

  it("Katch-McArdle con 59.1 kg de masa magra ≈ 1647 kcal", () => {
    expect(katchMcArdleBMR(59.1)).toBe(1647);
  });

  it("meta 75 kg / 15%: ganar ~4.6 kg de masa magra y perder ~2 kg de grasa", () => {
    const g = bodyGoalProgress(72.3, 18.3, 75, 15);
    expect(g.targetLeanKg).toBe(63.8);
    expect(g.leanToGainKg).toBe(4.7);
    expect(g.fatToLoseKg).toBe(1.9);
    expect(g.weightChangeKg).toBe(2.7);
    expect(g.estimatedMonths).toBe(11); // 4.7/0.5 + 1.9/2 = 9.4 + 0.95
  });
});

describe("computeEnergy con % de grasa", () => {
  const base: MemberInput = {
    name: "Gab",
    age: 33,
    sex: "male",
    weightKg: 72.3,
    heightCm: 181,
    neatLevel: "light",
    sportFreqPerWeek: 4,
    goal: "lose_fat",
    activePhase: "phase2",
  };

  it("usa Mifflin sin % de grasa", () => {
    expect(computeEnergy(base).bmrFormula).toBe("mifflin");
  });

  it("usa Katch-McArdle si hay % de grasa", () => {
    const r = computeEnergy({ ...base, bodyFatPct: 18.3 });
    expect(r.bmrFormula).toBe("katch");
    expect(r.bmr).toBe(1647);
  });
});

describe("registro diario", () => {
  const whey = { kcalPer100g: 370, proteinPer100g: 83, carbsPer100g: 3, fatPer100g: 0.5 };

  it("calcula la nutrición por gramos", () => {
    expect(nutritionForGrams(whey, 30)).toEqual({
      kcal: 111,
      proteinG: 24.9,
      carbsG: 0.9,
      fatG: 0.2,
    });
  });

  it("escala porciones de un plato", () => {
    expect(scaleNutrition({ kcal: 500, proteinG: 30, carbsG: 50, fatG: 15 }, 1.5)).toEqual({
      kcal: 750,
      proteinG: 45,
      carbsG: 75,
      fatG: 22.5,
    });
  });

  it("suma y calcula lo que falta", () => {
    const consumed = sumNutrition([
      { kcal: 520, proteinG: 45, carbsG: 50, fatG: 15 },
      { kcal: 650, proteinG: 50, carbsG: 60, fatG: 20 },
    ]);
    expect(consumed).toEqual({ kcal: 1170, proteinG: 95, carbsG: 110, fatG: 35 });
    const left = remainingNutrition({ kcal: 2200, proteinG: 160, carbsG: 220, fatG: 60 }, consumed);
    expect(left).toEqual({ kcal: 1030, proteinG: 65, carbsG: 110, fatG: 25 });
    expect(progressPct(1170, 2200)).toBe(53);
    expect(progressPct(10, 0)).toBe(0);
  });
});

describe("rutina personalizada", () => {
  it("parsea líneas 'nombre | series | reps' con valores por defecto", () => {
    const ex = parseExercises(
      "Press militar | 4 | 8-12\n- Elevaciones laterales | 3 | 12-15 al fallo\n\nCrunch en polea",
    );
    expect(ex).toEqual([
      { name: "Press militar", sets: 4, reps: "8-12" },
      { name: "Elevaciones laterales", sets: 3, reps: "12-15 al fallo" },
      { name: "Crunch en polea", sets: 3, reps: "8-12" },
    ]);
    expect(parseExercises(exercisesToText(ex))).toEqual(ex);
  });
});


describe("plantillas de rutina", () => {
  it("la rutina de hombros cubre los 7 días", () => {
    expect(SHOULDER_FOCUS_ROUTINE.map((d) => d.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("reparte un full body A/B en lun-mié-vie", () => {
    const week = weekFromSessions(
      [
        { title: "A", exercises: [] },
        { title: "B", exercises: [] },
      ],
      3,
    );
    expect(week.map((d) => (d.kind === "rest" ? "-" : d.title)).join("")).toBe("A-B-A--");
  });
});
