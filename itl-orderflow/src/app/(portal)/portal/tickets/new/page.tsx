import { getPortalOrders } from "@/actions/tickets";
import { PortalTicketForm } from "@/components/portal/ticket-form";
import { requirePortalSession } from "@/lib/portal-session";

export default async function PortalNewTicketPage() {
  await requirePortalSession("canViewTickets");

  const orders = await getPortalOrders();

  return (
    <div className="max-w-2xl mx-auto">
      <PortalTicketForm
        orders={orders}
      />
    </div>
  );
}
