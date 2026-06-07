import { describe, expect, it } from "vitest";
import {
  balanceLabel,
  calcActivityFactor,
  calcBMR,
  calcCalorieAdjustment,
  calcMacros,
  calcTDEE,
  computeEnergy,
} from "./energy";
import type { MemberInput } from "./types";

describe("calcBMR (Mifflin-St Jeor)", () => {
  it("calcula el BMR de un hombre", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calcBMR({ weightKg: 80, heightCm: 180, age: 30, sex: "male" })).toBe(1780);
  });

  it("calcula el BMR de una mujer", () => {
    // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
    expect(calcBMR({ weightKg: 60, heightCm: 165, age: 28, sex: "female" })).toBe(1330);
  });
});

describe("calcActivityFactor", () => {
  it("usa el factor NEAT base sin deporte", () => {
    expect(calcActivityFactor("sedentary", 0)).toBe(1.2);
    expect(calcActivityFactor("active", 0)).toBe(1.725);
  });

  it("suma 0.025 por sesión de deporte con tope de 6", () => {
    expect(calcActivityFactor("light", 4)).toBe(1.475); // 1.375 + 0.1
    expect(calcActivityFactor("light", 10)).toBe(1.525); // tope: 1.375 + 0.15
  });
});

describe("calcTDEE", () => {
  it("multiplica BMR por el factor de actividad", () => {
    expect(calcTDEE(1780, 1.55)).toBe(2759);
  });
});

describe("calcCalorieAdjustment", () => {
  it("fase 1: déficit ligero salvo ganar masa", () => {
    expect(calcCalorieAdjustment("phase1", "lose_fat")).toBe(-0.1);
    expect(calcCalorieAdjustment("phase1", "gain_muscle")).toBe(0);
  });
  it("fase 2: déficit marcado o superávit ligero", () => {
    expect(calcCalorieAdjustment("phase2", "lose_fat")).toBe(-0.2);
    expect(calcCalorieAdjustment("phase2", "gain_muscle")).toBe(0.1);
    expect(calcCalorieAdjustment("phase2", "recomp")).toBe(-0.15);
  });
  it("fase 3: mantenimiento", () => {
    expect(calcCalorieAdjustment("phase3", "lose_fat")).toBe(0);
  });
});

describe("balanceLabel", () => {
  it("traduce el ajuste a etiqueta", () => {
    expect(balanceLabel(-0.2)).toBe("deficit");
    expect(balanceLabel(0)).toBe("maintenance");
    expect(balanceLabel(0.1)).toBe("surplus");
  });
});

describe("calcMacros", () => {
  it("prioriza proteína por peso y reparte el resto", () => {
    const m = calcMacros(2000, 80, "phase1", "recomp");
    expect(m.proteinG).toBe(160); // 2.0 g/kg * 80
    expect(m.fatG).toBeGreaterThan(0);
    expect(m.carbsG).toBeGreaterThan(0);
    // Los porcentajes suman ~100
    expect(Math.round(m.proteinPct + m.carbsPct + m.fatPct)).toBe(100);
  });

  it("aplica grasa mínima por g/kg cuando las calorías son bajas", () => {
    const m = calcMacros(1200, 90, "phase2", "lose_fat");
    expect(m.fatG).toBeGreaterThanOrEqual(0.8 * 90);
  });
});

describe("computeEnergy (integración)", () => {
  it("encadena BMR → TDEE → fase → macros", () => {
    const member: MemberInput = {
      name: "Papá",
      age: 30,
      sex: "male",
      weightKg: 80,
      heightCm: 180,
      neatLevel: "moderate",
      sportFreqPerWeek: 3,
      goal: "lose_fat",
      activePhase: "phase2",
    };
    const r = computeEnergy(member);
    expect(r.bmr).toBe(1780);
    expect(r.activityFactor).toBe(1.625); // 1.55 + 0.075
    expect(r.tdee).toBe(2893);
    expect(r.calorieAdjustment).toBe(-0.2);
    expect(r.targetCalories).toBe(2314); // 2893 * 0.8
    expect(r.balance).toBe("deficit");
    expect(r.macros.proteinG).toBe(176); // 2.2 * 80
  });
});
