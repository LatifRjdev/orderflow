import { prisma } from "@/lib/prisma";
import { InvoiceEditor } from "@/components/finance/invoice-editor";

export default async function NewInvoicePage() {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      title: true,
      number: true,
      clientId: true,
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <InvoiceEditor
      mode="create"
      orders={orders.map((o) => ({
        id: o.id,
        title: o.title,
        number: o.number,
        clientId: o.clientId,
        client: o.client ? { id: o.client.id, name: o.client.name } : undefined,
      }))}
    />
  );
}
