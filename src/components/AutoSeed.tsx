"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { seedFamilyData } from "@/app/actions/seed";

// Siembra la data peruana de arranque la primera vez que la familia
// entra (si todavía no tiene ingredientes), y refresca la vista.
export function AutoSeed() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    setDone(true);
    seedFamilyData().then((res) => {
      if (res.ok && "seeded" in res && res.seeded) router.refresh();
    });
  }, [done, router]);

  return (
    <div className="card text-center text-sm text-stone-500">
      Preparando tus platos peruanos de ejemplo…
    </div>
  );
}
