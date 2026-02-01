import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getInvoice } from "@/actions/invoices";
import { InvoiceEditor } from "@/components/finance/invoice-editor";

interface EditInvoicePageProps {
  params: { id: string };
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

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
      mode="edit"
      orders={orders.map((o) => ({
        id: o.id,
        title: o.title,
        number: o.number,
        clientId: o.clientId,
        client: o.client ? { id: o.client.id, name: o.client.name } : undefined,
      }))}
      invoice={{
        id: invoice.id,
        number: invoice.number,
        orderId: invoice.orderId || undefined,
        clientId: invoice.clientId,
        clientName: invoice.client?.name,
        issueDate: new Date(invoice.issueDate).toISOString().split("T")[0],
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : undefined,
        currency: invoice.currency,
        notes: invoice.notes || "",
        discountPercent: invoice.subtotal > 0 && invoice.discountAmount > 0
          ? Math.round((invoice.discountAmount / invoice.subtotal) * 100)
          : 0,
        taxPercent: invoice.subtotal > 0 && invoice.taxAmount > 0
          ? Math.round((invoice.taxAmount / (invoice.subtotal - invoice.discountAmount)) * 100)
          : 0,
        items: invoice.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.total,
        })) || [],
      }}
    />
  );
}
