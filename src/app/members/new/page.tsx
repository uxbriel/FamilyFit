import { PageHeader } from "@/components/PageHeader";
import { MemberForm } from "@/components/MemberForm";
import { createMember } from "../actions";

export default function NewMemberPage() {
  return (
    <main className="px-4 py-3">
      <PageHeader title="Nuevo miembro" back="/members" />
      <MemberForm action={createMember} />
    </main>
  );
}
