import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContract } from "@/actions/contracts";
import { ContractEditor } from "@/components/documents/contract-editor";

export default async function EditContractPage({ params }: { params: { id: string } }) {
  const contract = await getContract(params.id);
  if (!contract) notFound();

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

  return (
    <ContractEditor
      mode="edit"
      clients={clients}
      orders={orders}
      contract={{
        id: contract.id,
        title: contract.title,
        clientId: contract.clientId,
        orderId: contract.orderId || undefined,
        contractDate: contract.contractDate.toISOString().split("T")[0],
        startDate: contract.startDate?.toISOString().split("T")[0],
        endDate: contract.endDate?.toISOString().split("T")[0],
        totalAmount: contract.totalAmount,
        currency: contract.currency,
        sections: contract.sections?.map((s: any) => ({
          type: s.type,
          title: s.title,
          content: s.content,
          position: s.position,
        })),
      }}
    />
  );
}
