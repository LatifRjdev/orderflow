import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient } from "@/actions/portal";
import { getPortalTickets } from "@/actions/tickets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Plus,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const ticketStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" }
> = {
  OPEN: { label: "Открыт", variant: "default" },
  IN_PROGRESS: { label: "В работе", variant: "warning" },
  RESOLVED: { label: "Решён", variant: "success" },
  CLOSED: { label: "Закрыт", variant: "secondary" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "warning" }> = {
  LOW: { label: "Низкий", variant: "secondary" },
  MEDIUM: { label: "Средний", variant: "default" },
  HIGH: { label: "Высокий", variant: "warning" },
  URGENT: { label: "Срочный", variant: "destructive" },
};

export default async function PortalTicketsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const { tickets, stats } = await getPortalTickets(client.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Обращения</h1>
          <p className="text-muted-foreground mt-1">
            Ваши обращения в службу поддержки
          </p>
        </div>
        <Link href="/portal/tickets/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Создать обращение
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Открытых</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">В работе</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Решённых</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((ticket: any) => {
          const st = ticketStatusConfig[ticket.status] || ticketStatusConfig.OPEN;
          const pr = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

          return (
            <Link key={ticket.id} href={`/portal/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {ticket.number}
                        </span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {ticket.priority !== "MEDIUM" && (
                          <Badge variant={pr.variant}>{pr.label}</Badge>
                        )}
                      </div>
                      <h3 className="font-medium truncate">{ticket.subject}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {ticket.order && (
                          <span>Проект: {ticket.order.number}</span>
                        )}
                        <span>{ticket._count.messages} сообщений</span>
                        <span>{formatRelativeTime(ticket.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {tickets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Обращений пока нет</p>
              <Link href="/portal/tickets/new">
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Создать обращение
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
