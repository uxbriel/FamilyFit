"use client";

import { deleteMember } from "@/app/members/actions";

export function DeleteMemberButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteMember.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="btn-ghost w-full text-sm text-red-600">Eliminar miembro</button>
    </form>
  );
}
