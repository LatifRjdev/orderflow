import { prisma } from "@/lib/prisma";
import { AmendmentEditor } from "@/components/documents/amendment-editor";

export default async function NewAmendmentPage() {
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      number: true,
      title: true,
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AmendmentEditor mode="create" contracts={contracts} />;
}
