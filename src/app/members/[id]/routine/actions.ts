"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMember } from "@/lib/data";
import { generateTrainingPlan } from "@/lib/calc/training";
import {
  SHOULDER_FOCUS_ROUTINE,
  parseExercises,
  weekFromSessions,
  type RoutineDayTemplate,
} from "@/lib/calc/routine";
import type { WorkoutKind } from "@/lib/supabase/types";

const KINDS: WorkoutKind[] = ["strength", "cardio", "rest"];

async function saveWeek(memberId: string, days: RoutineDayTemplate[]) {
  const member = await getMember(memberId);
  if (!member) throw new Error("Miembro no encontrado");

  const supabase = createClient();
  const rows = days.map((d) => ({
    family_id: member.family_id,
    member_id: memberId,
    day_of_week: d.dayOfWeek,
    kind: d.kind,
    title: d.title,
    notes: d.notes ?? null,
    exercises: d.kind === "rest" ? [] : d.exercises,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("workout_days")
    .upsert(rows, { onConflict: "member_id,day_of_week" });
  if (error) throw new Error(error.message);

  revalidatePath(`/members/${memberId}`);
  revalidatePath(`/members/${memberId}/routine`);
  revalidatePath("/");
}

/** Guarda los 7 días del formulario de rutina. */
export async function saveRoutine(memberId: string, formData: FormData) {
  const days: RoutineDayTemplate[] = Array.from({ length: 7 }, (_, day) => {
    const rawKind = String(formData.get(`kind_${day}`) ?? "rest") as WorkoutKind;
    const kind = KINDS.includes(rawKind) ? rawKind : "rest";
    return {
      dayOfWeek: day,
      kind,
      title: String(formData.get(`title_${day}`) ?? "").trim(),
      notes: String(formData.get(`notes_${day}`) ?? "").trim() || undefined,
      exercises: parseExercises(String(formData.get(`exercises_${day}`) ?? "")),
    };
  });
  await saveWeek(memberId, days);
  redirect(`/members/${memberId}`);
}

/** Carga una rutina de partida (luego se edita libremente). */
export async function loadRoutineTemplate(memberId: string, template: "shoulders" | "phase") {
  if (template === "shoulders") {
    await saveWeek(memberId, SHOULDER_FOCUS_ROUTINE);
    return;
  }
  const member = await getMember(memberId);
  if (!member) throw new Error("Miembro no encontrado");
  const plan = generateTrainingPlan(member.active_phase, member.goal);
  await saveWeek(memberId, weekFromSessions(plan.days, plan.daysPerWeek, plan.notes));
}

/** Borra la rutina personalizada (vuelve a la plantilla automática). */
export async function clearRoutine(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("workout_days").delete().eq("member_id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath(`/members/${memberId}/routine`);
}
