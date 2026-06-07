import Link from "next/link";

// Encabezado de página con botón de volver.
export function PageHeader({
  title,
  back = "/",
  action,
}: {
  title: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-2 border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur">
      <Link href={back} className="text-stone-500" aria-label="Volver">
        ←
      </Link>
      <h1 className="flex-1 truncate text-lg font-bold text-stone-800">{title}</h1>
      {action}
    </header>
  );
}
