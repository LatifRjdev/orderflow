import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, FolderKanban, FileText, ScrollText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPortalClient } from "@/actions/portal";
import { PortalLogoutButton } from "@/components/portal-logout-button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) {
    redirect("/portal/login");
  }

  const client = await getPortalClient(token);

  if (!client) {
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
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
                <Link href="/portal">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <FolderKanban className="w-4 h-4" />
                    Проекты
                  </Button>
                </Link>
                <Link href="/portal/proposals">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ScrollText className="w-4 h-4" />
                    Предложения
                  </Button>
                </Link>
                <Link href="/portal/invoices">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Счета
                  </Button>
                </Link>
                <Link href="/portal/tickets">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Обращения
                  </Button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {client.name}
              </span>
              <PortalLogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
