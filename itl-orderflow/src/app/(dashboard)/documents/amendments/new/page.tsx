import { prisma } from "@/lib/prisma";
import { AmendmentForm } from "@/components/documents/amendment-form";

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

  return <AmendmentForm contracts={contracts} />;
}
