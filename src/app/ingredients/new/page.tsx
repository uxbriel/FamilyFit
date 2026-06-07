import { PageHeader } from "@/components/PageHeader";
import { IngredientForm } from "@/components/IngredientForm";
import { createIngredient } from "../actions";

export default function NewIngredientPage() {
  return (
    <main className="px-4 py-3">
      <PageHeader title="Nuevo ingrediente" back="/ingredients" />
      <IngredientForm action={createIngredient} />
    </main>
  );
}
