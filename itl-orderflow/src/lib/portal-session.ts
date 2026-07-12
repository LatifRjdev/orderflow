import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PortalPermissionKey } from "@/lib/portal-permissions";

export interface PortalSession {
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    position: string | null;
  };
  client: {
    id: string;
    name: string;
    email: string | null;
  };
  permissions: Record<PortalPermissionKey, boolean>;
}

export async function getPortalSession(token: string): Promise<PortalSession | null> {
  const contact = await prisma.clientContact.findFirst({
    where: {
      portalToken: token,
      portalEnabled: true,
      client: { isArchived: false },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      canViewProjects: true,
      canViewProposals: true,
      canViewFinance: true,
      canViewDocuments: true,
      canViewTickets: true,
      client: { select: { id: true, name: true, email: true } },
    },
  });

  if (!contact) return null;

  return {
    contact: {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      position: contact.position,
    },
    client: contact.client,
    permissions: {
      canViewProjects: contact.canViewProjects,
      canViewProposals: contact.canViewProposals,
      canViewFinance: contact.canViewFinance,
      canViewDocuments: contact.canViewDocuments,
      canViewTickets: contact.canViewTickets,
    },
  };
}

export async function requirePortalSession(
  permission?: PortalPermissionKey
): Promise<PortalSession> {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;
  if (!token) return redirect("/portal/login");

  const session = await getPortalSession(token);
  if (!session) return redirect("/portal/login");

  if (permission && !session.permissions[permission]) {
    return redirect("/portal?denied=1");
  }

  return session;
}

// Used by automatic email notifications (see src/actions/notifications.ts) to pick
// which contact should receive a transactional email for a given portal section.
export async function findPortalContactForNotification(
  clientId: string,
  permission: PortalPermissionKey
) {
  const permissionFilter: Partial<Record<PortalPermissionKey, boolean>> = { [permission]: true };

  return prisma.clientContact.findFirst({
    where: {
      clientId,
      portalEnabled: true,
      email: { not: null },
      ...permissionFilter,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, email: true, portalToken: true, firstName: true },
  });
}
