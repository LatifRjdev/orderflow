import { notFound } from "next/navigation";
import Link from "next/link";
import { getPortalTicket } from "@/actions/tickets";
import { requirePortalSession } from "@/lib/portal-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderKanban, User, Clock } from "lucide-react";
import { PortalTicketMessageForm } from "@/components/portal/ticket-message-form";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

const ticketStatusDots: Record<string, { label: string; dot: string }> = {
  OPEN: { label: "Открыт", dot: "#3b82f6" },
  IN_PROGRESS: { label: "В работе", dot: "#f59e0b" },
  RESOLVED: { label: "Решён", dot: "#22c55e" },
  CLOSED: { label: "Закрыт", dot: "#9ca3af" },
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
  const session = await requirePortalSession("canViewTickets");
  const { client } = session;

  const ticket = await getPortalTicket(client.id, params.id);
  if (!ticket) notFound();

  const st = ticketStatusDots[ticket.status] || ticketStatusDots.OPEN;
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
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
            style={{ borderColor: st.dot + "40", backgroundColor: st.dot + "10" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
            <span className="text-sm font-medium" style={{ color: st.dot }}>{st.label}</span>
          </div>
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
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="text-base font-semibold">Описание</h3>
        </div>
        <div className="px-6 pb-6">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </div>

      {/* Messages */}
      {ticket.messages.length > 0 && (
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-base font-semibold">
              Переписка ({ticket.messages.length})
            </h3>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {ticket.messages.map((message: any) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.isFromClient
                    ? "bg-primary/5 border border-primary/10"
                    : "bg-background-light"
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
          </div>
        </div>
      )}

      {/* Reply form */}
      {!isClosed ? (
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-base font-semibold">Ответить</h3>
          </div>
          <div className="px-6 pb-6">
            <PortalTicketMessageForm
              clientName={client.name}
              ticketId={ticket.id}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5 text-center text-muted-foreground">
          Обращение закрыто. Если у вас остались вопросы, создайте новое
          обращение.
        </div>
      )}
    </div>
  );
}
