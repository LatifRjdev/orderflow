import { notFound } from "next/navigation";
import Link from "next/link";
import { getTicket, getTeamUsers } from "@/actions/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FolderKanban,
  User,
  Clock,
  Building2,
  Lock,
} from "lucide-react";
import { TicketStatusSelect } from "@/components/tickets/ticket-status-select";
import { TicketAssignSelect } from "@/components/tickets/ticket-assign-select";
import { TicketMessageForm } from "@/components/tickets/ticket-message-form";
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

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [ticket, users] = await Promise.all([
    getTicket(params.id),
    getTeamUsers(),
  ]);

  if (!ticket) notFound();

  const st = ticketStatusConfig[ticket.status] || ticketStatusConfig.OPEN;
  const pr = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/tickets">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Назад к обращениям
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
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
                    message.isInternal
                      ? "bg-amber-50 border border-amber-200"
                      : message.isFromClient
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {message.isFromClient
                          ? message.clientName || "Клиент"
                          : message.user?.name || "Сотрудник"}
                      </span>
                      {message.isFromClient && (
                        <Badge variant="outline" className="text-xs">
                          Клиент
                        </Badge>
                      )}
                      {message.isInternal && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          <Lock className="w-3 h-3 mr-1" />
                          Внутренняя
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              {ticket.messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Сообщений пока нет
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reply form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ответить</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketMessageForm ticketId={ticket.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Статус
                </label>
                <TicketStatusSelect
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Ответственный
                </label>
                <TicketAssignSelect
                  ticketId={ticket.id}
                  currentAssigneeId={ticket.assigneeId}
                  users={users}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Клиент
                </label>
                <Link
                  href={`/clients/${ticket.client.id}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {ticket.client.name}
                </Link>
              </div>

              {ticket.order && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Проект
                  </label>
                  <Link
                    href={`/orders/${ticket.order.id}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    {ticket.order.number} — {ticket.order.title}
                  </Link>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Создано
                </label>
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatDateTime(ticket.createdAt)}
                </span>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Решено
                  </label>
                  <span className="text-sm">{formatDateTime(ticket.resolvedAt)}</span>
                </div>
              )}

              {ticket.closedAt && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Закрыто
                  </label>
                  <span className="text-sm">{formatDateTime(ticket.closedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
