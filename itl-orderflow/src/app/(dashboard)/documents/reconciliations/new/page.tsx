import { prisma } from "@/lib/prisma";
import { ReconciliationEditor } from "@/components/documents/reconciliation-editor";

export default async function NewReconciliationPage() {
  const clients = await prisma.client.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <ReconciliationEditor clients={clients} />;
}
