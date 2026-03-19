import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAmendment } from "@/actions/amendments";
import { AmendmentEditor } from "@/components/documents/amendment-editor";

export default async function EditAmendmentPage({ params }: { params: { id: string } }) {
  const amendment = await getAmendment(params.id);
  if (!amendment) notFound();

  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      number: true,
      title: true,
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AmendmentEditor
      mode="edit"
      contracts={contracts}
      amendment={{
        id: amendment.id,
        title: amendment.title,
        contractId: amendment.contractId,
        effectiveDate: amendment.effectiveDate.toISOString().split("T")[0],
        description: amendment.description,
        changes: amendment.changes,
      }}
    />
  );
}
