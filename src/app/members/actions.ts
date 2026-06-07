"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data";

function parseMember(formData: FormData) {
  const wantsGym = formData.get("wants_gym") === "on";
  return {
    name: String(formData.get("name") ?? "").trim(),
    age: Number(formData.get("age")),
    sex: String(formData.get("sex")) as "male" | "female",
    weight_kg: Number(formData.get("weight_kg")),
    height_cm: Number(formData.get("height_cm")),
    neat_level: String(formData.get("neat_level")) as
      | "sedentary"
      | "light"
      | "moderate"
      | "active",
    sport_type: (String(formData.get("sport_type") ?? "").trim() || null) as string | null,
    sport_freq_per_week: Number(formData.get("sport_freq_per_week") ?? 0),
    wants_gym: wantsGym,
    goal: String(formData.get("goal")) as
      | "lose_fat"
      | "gain_muscle"
      | "recomp"
      | "maintain",
    active_phase: String(formData.get("active_phase")) as "phase1" | "phase2" | "phase3",
  };
}

export async function createMember(formData: FormData) {
  const supabase = createClient();
  const family = await getFamily();
  if (!family) throw new Error("No se encontró la familia");

  const { error } = await supabase
    .from("members")
    .insert({ family_id: family.id, ...parseMember(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/members");
  redirect("/members");
}

export async function updateMember(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("members").update(parseMember(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  redirect(`/members/${id}`);
}

export async function deleteMember(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/members");
  redirect("/members");
}
