import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getMembers } from "@/lib/data";
import { computeEnergy } from "@/lib/calc/energy";
import { memberToInput } from "@/lib/calc/adapt";
import { GOAL_LABELS, PHASE_SHORT } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <main className="px-4 py-3">
      <PageHeader
        title="Miembros"
        action={
          <Link href="/members/new" className="btn-primary text-xs">
            + Nuevo
          </Link>
        }
      />

      {members.length === 0 ? (
        <p className="card text-center text-sm text-stone-500">
          Aún no hay miembros. Agrega el primero con “+ Nuevo”.
        </p>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const e = computeEnergy(memberToInput(m));
            return (
              <Link key={m.id} href={`/members/${m.id}`} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-stone-500">
                    {m.age} años · {Number(m.weight_kg)} kg · {GOAL_LABELS[m.goal]} ·{" "}
                    {PHASE_SHORT[m.active_phase]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">{e.targetCalories}</p>
                  <p className="text-xs text-stone-400">kcal</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
