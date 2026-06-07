import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { IngredientForm } from "@/components/IngredientForm";
import { DeleteButton } from "@/components/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { deleteIngredient, updateIngredient } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditIngredientPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: ingredient } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!ingredient) notFound();

  return (
    <main className="px-4 py-3">
      <PageHeader title={`Editar ${ingredient.name}`} back="/ingredients" />
      <IngredientForm ingredient={ingredient} action={updateIngredient.bind(null, ingredient.id)} />
      <div className="mt-3">
        <DeleteButton
          action={deleteIngredient.bind(null, ingredient.id)}
          label="Eliminar ingrediente"
          confirmText={`¿Eliminar ${ingredient.name}?`}
        />
      </div>
    </main>
  );
}
