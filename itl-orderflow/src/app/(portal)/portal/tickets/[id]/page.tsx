import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalClient } from "@/actions/portal";
import { getPortalTicket } from "@/actions/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderKanban, User, Clock } from "lucide-react";
import { PortalTicketMessageForm } from "@/components/portal/ticket-message-form";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

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

export default async function PortalTicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const ticket = await getPortalTicket(client.id, params.id);
  if (!ticket) notFound();

  const st = ticketStatusConfig[ticket.status] || ticketStatusConfig.OPEN;
  const pr = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/portal/tickets">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Назад к обращениям
        </Button>
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-mono text-muted-foreground">
            {ticket.number}
          </span>
          <Badge variant={st.variant}>{st.label}</Badge>
          <Badge variant={pr.variant}>{pr.label}</Badge>
        </div>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDateTime(ticket.createdAt)}
          </span>
          {ticket.order && (
            <Link
              href={`/portal/orders/${ticket.order.id}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              {ticket.order.number} — {ticket.order.title}
            </Link>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Описание</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* Messages */}
      {ticket.messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Переписка ({ticket.messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.messages.map((message: any) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.isFromClient
                    ? "bg-primary/5 border border-primary/10"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {message.isFromClient
                        ? message.clientName || "Вы"
                        : message.user?.name || "Поддержка"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reply form */}
      {!isClosed ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ответить</CardTitle>
          </CardHeader>
          <CardContent>
            <PortalTicketMessageForm
              clientId={client.id}
              clientName={client.name}
              ticketId={ticket.id}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 text-center text-muted-foreground">
            Обращение закрыто. Если у вас остались вопросы, создайте новое
            обращение.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
