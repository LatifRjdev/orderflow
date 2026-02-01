import { prisma } from "@/lib/prisma";
import { ProposalEditor } from "@/components/proposals/proposal-editor";

export default async function NewProposalPage() {
  const [clients, orders] = await Promise.all([
    prisma.client.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        title: true,
        number: true,
        clientId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ProposalEditor
      mode="create"
      clients={clients}
      orders={orders}
    />
  );
}
