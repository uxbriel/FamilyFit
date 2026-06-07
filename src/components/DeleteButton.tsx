"use client";

// Botón de borrado genérico con confirmación, para usar con server actions.
export function DeleteButton({
  action,
  label,
  confirmText,
}: {
  action: () => void | Promise<void>;
  label: string;
  confirmText: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button className="btn-ghost w-full text-sm text-red-600">{label}</button>
    </form>
  );
}
