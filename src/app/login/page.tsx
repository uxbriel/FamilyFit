"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, signUp } from "./actions";
import { Disclaimer } from "@/components/Disclaimer";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Cargando…" : label}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useFormState(action, null as null | { error: string });

  return (
    <main className="flex min-h-screen flex-col justify-center px-5 py-10">
      <div className="mb-6 text-center">
        <div className="text-4xl">🍲💪</div>
        <h1 className="mt-2 text-2xl font-bold text-brand-600">FamilyFit</h1>
        <p className="text-sm text-stone-500">
          Nutrición y entrenamiento para toda la familia
        </p>
      </div>

      <div className="card">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
          <button
            className={`rounded-lg py-2 text-sm font-medium ${mode === "signin" ? "bg-white shadow" : "text-stone-500"}`}
            onClick={() => setMode("signin")}
          >
            Ingresar
          </button>
          <button
            className={`rounded-lg py-2 text-sm font-medium ${mode === "signup" ? "bg-white shadow" : "text-stone-500"}`}
            onClick={() => setMode("signup")}
          >
            Crear cuenta
          </button>
        </div>

        <form action={formAction} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="label" htmlFor="family_name">
                Nombre de la familia
              </label>
              <input
                id="family_name"
                name="family_name"
                className="input"
                placeholder="Familia Pacahuala"
                required
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Correo
            </label>
            <input id="email" name="email" type="email" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              minLength={6}
              required
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <SubmitButton label={mode === "signin" ? "Ingresar" : "Crear mi familia"} />
        </form>
      </div>

      <div className="mt-6">
        <Disclaimer />
      </div>
    </main>
  );
}
