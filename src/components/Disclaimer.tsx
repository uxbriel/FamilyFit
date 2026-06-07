// Aviso visible en todas las páginas: la app es solo orientativa.
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-stone-500">
        ⚠️ Estimaciones generales. No reemplazan a un nutricionista o médico.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold">⚠️ Aviso importante</p>
      <p className="mt-1 leading-snug">
        Esta app ofrece <strong>estimaciones generales</strong> y{" "}
        <strong>no sustituye la asesoría de un nutricionista o médico</strong>. Cada
        miembro debe corroborar su plan con un profesional, especialmente si tiene
        alergias, intolerancias, condiciones de salud o particularidades en su
        metabolismo.
      </p>
    </div>
  );
}
