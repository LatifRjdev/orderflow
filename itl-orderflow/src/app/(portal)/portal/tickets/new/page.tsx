import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/actions/portal";
import { getPortalOrders } from "@/actions/tickets";
import { PortalTicketForm } from "@/components/portal/ticket-form";

export default async function PortalNewTicketPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

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
