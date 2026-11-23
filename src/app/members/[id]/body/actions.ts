"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMember } from "@/lib/data";
import { isISODate, todayISO } from "@/lib/week";

function optionalNumber(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function revalidateMember(memberId: string) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  revalidatePath(`/members/${memberId}/body`);
  revalidatePath("/log");
}

/**
 * Sincroniza peso y % de grasa del miembro con su medición más reciente,
 * para que las calorías y macros usen siempre el último dato.
 */
async function syncMemberWithLatest(memberId: string) {
  const supabase = createClient();
  const { data: latest } = await supabase
    .from("body_measurements")
    .select("weight_kg, body_fat_pct")
    .eq("member_id", memberId)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return;
  // El % de grasa sale de la última medición que lo tenga (no todas lo traen).
  const { data: latestFat } = await supabase
    .from("body_measurements")
    .select("body_fat_pct")
    .eq("member_id", memberId)
    .not("body_fat_pct", "is", null)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase
    .from("members")
    .update({ weight_kg: latest.weight_kg, body_fat_pct: latestFat?.body_fat_pct ?? null })
    .eq("id", memberId);
}

export async function addMeasurement(memberId: string, formData: FormData) {
  const member = await getMember(memberId);
  if (!member) throw new Error("Miembro no encontrado");

  const weight = optionalNumber(formData.get("weight_kg"));
  if (!weight || weight <= 0) throw new Error("Ingresa el peso");
  const date = String(formData.get("measured_on") ?? "");

  const supabase = createClient();
  const { error } = await supabase.from("body_measurements").insert({
    family_id: member.family_id,
    member_id: memberId,
    measured_on: isISODate(date) ? date : todayISO(),
    weight_kg: weight,
    body_fat_pct: optionalNumber(formData.get("body_fat_pct")),
    muscle_mass_kg: optionalNumber(formData.get("muscle_mass_kg")),
    visceral_fat: optionalNumber(formData.get("visceral_fat")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  await syncMemberWithLatest(memberId);
  revalidateMember(memberId);
}

export async function deleteMeasurement(memberId: string, measurementId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("body_measurements").delete().eq("id", measurementId);
  if (error) throw new Error(error.message);
  await syncMemberWithLatest(memberId);
  revalidateMember(memberId);
}

export async function updateBodyGoal(memberId: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("members")
    .update({
      target_weight_kg: optionalNumber(formData.get("target_weight_kg")),
      target_body_fat_pct: optionalNumber(formData.get("target_body_fat_pct")),
    })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidateMember(memberId);
}
