import Link from "next/link";
import {
  Building2,
  FolderKanban,
  FileText,
  ScrollText,
  MessageCircle,
  FileStack,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requirePortalSession } from "@/lib/portal-session";
import { PORTAL_SECTIONS, PortalPermissionKey } from "@/lib/portal-permissions";
import { PortalLogoutButton } from "@/components/portal-logout-button";

const ICONS: Record<PortalPermissionKey, LucideIcon> = {
  canViewProjects: FolderKanban,
  canViewProposals: ScrollText,
  canViewFinance: FileText,
  canViewDocuments: FileStack,
  canViewTickets: MessageCircle,
};

const HREFS: Record<PortalPermissionKey, string> = {
  canViewProjects: "/portal",
  canViewProposals: "/portal/proposals",
  canViewFinance: "/portal/invoices",
  canViewDocuments: "/portal/documents",
  canViewTickets: "/portal/tickets",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePortalSession();

  const navItems = PORTAL_SECTIONS.filter((section) => session.permissions[section.key]).map(
    (section) => ({
      ...section,
      icon: ICONS[section.key],
      href: HREFS[section.key],
    })
  );
  const hasAnyAccess = Object.values(session.permissions).some(Boolean);

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-[#dbdfe6] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/portal" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">ITL Solutions</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block text-right">
                <p className="font-medium text-foreground">{session.client.name}</p>
                <p className="text-xs">
                  {session.contact.firstName} {session.contact.lastName}
                  {session.contact.position ? ` · ${session.contact.position}` : ""}
                </p>
              </div>
              <PortalLogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasAnyAccess ? (
          children
        ) : (
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-12 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Доступ не настроен</p>
            <p className="text-sm mt-1">
              Обратитесь к вашему менеджеру, чтобы включить нужные разделы портала.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
