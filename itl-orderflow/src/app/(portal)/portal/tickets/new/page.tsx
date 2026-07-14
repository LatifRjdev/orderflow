import { getPortalOrders } from "@/actions/tickets";
import { PortalTicketForm } from "@/components/portal/ticket-form";
import { requirePortalSession } from "@/lib/portal-session";

export default async function PortalNewTicketPage() {
  const session = await requirePortalSession("canViewTickets");
  const { client } = session;

  const orders = await getPortalOrders(client.id);

  return (
    <div className="max-w-2xl mx-auto">
      <PortalTicketForm
        clientId={client.id}
        clientName={client.name}
        orders={orders}
      />
    </div>
  );
}
