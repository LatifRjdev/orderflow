import { prisma } from "@/lib/prisma";
import { ContractForm } from "@/components/documents/contract-form";

export default async function NewContractPage() {
  const [clients, orders] = await Promise.all([
    prisma.client.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      select: { id: true, title: true, number: true, clientId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <ContractForm clients={clients} orders={orders} />;
}
