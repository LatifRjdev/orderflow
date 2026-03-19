import { prisma } from "@/lib/prisma";
import { ReconciliationForm } from "@/components/documents/reconciliation-form";

export default async function NewReconciliationPage() {
  const clients = await prisma.client.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <ReconciliationForm clients={clients} />;
}
