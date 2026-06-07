"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traducirError(error.message) };
  redirect("/");
}

export async function signUp(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const familyName = String(formData.get("family_name") ?? "Mi familia");
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { family_name: familyName } },
  });
  if (error) return { error: traducirError(error.message) };
  // Si la confirmación de correo está desactivada, ya hay sesión.
  redirect("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function traducirError(msg: string): string {
  if (msg.includes("Invalid login")) return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered")) return "Ese correo ya está registrado.";
  if (msg.includes("at least 6")) return "La contraseña debe tener al menos 6 caracteres.";
  return msg;
}
