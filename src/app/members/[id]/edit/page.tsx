import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { MemberForm } from "@/components/MemberForm";
import { getMember } from "@/lib/data";
import { updateMember } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const member = await getMember(params.id);
  if (!member) notFound();

  const action = updateMember.bind(null, member.id);

  return (
    <main className="px-4 py-3">
      <PageHeader title={`Editar ${member.name}`} back={`/members/${member.id}`} />
      <MemberForm member={member} action={action} />
    </main>
  );
}
