import Link from "next/link";
import { getTickets } from "@/actions/tickets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  User,
  FolderKanban,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const ticketStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }
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

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; clientId?: string; assigneeId?: string; priority?: string };
}) {
  const { tickets, total } = await getTickets({
    search: searchParams.search,
    status: searchParams.status,
    clientId: searchParams.clientId,
    assigneeId: searchParams.assigneeId,
    priority: searchParams.priority,
  });

  const openCount = tickets.filter((t: any) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Обращения</h1>
          <p className="text-sm text-muted-foreground">
            {total} обращений
            {openCount > 0 && ` · ${openCount} открытых`}
            {inProgressCount > 0 && ` · ${inProgressCount} в работе`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Поиск по теме или номеру..."
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-1 min-w-[200px]"
            />
            <select
              name="status"
              defaultValue={searchParams.status}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Все статусы</option>
              <option value="OPEN">Открыт</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="RESOLVED">Решён</option>
              <option value="CLOSED">Закрыт</option>
            </select>
            <select
              name="priority"
              defaultValue={searchParams.priority}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Все приоритеты</option>
              <option value="LOW">Низкий</option>
              <option value="MEDIUM">Средний</option>
              <option value="HIGH">Высокий</option>
              <option value="URGENT">Срочный</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Поиск
            </button>
            {(searchParams.search || searchParams.status || searchParams.priority) && (
              <Link
                href="/tickets"
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Сбросить
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-5 font-medium">Номер / Тема</th>
                <th className="text-left py-3 px-5 font-medium">Клиент</th>
                <th className="text-left py-3 px-5 font-medium">Статус</th>
                <th className="text-left py-3 px-5 font-medium">Приоритет</th>
                <th className="text-left py-3 px-5 font-medium">Ответственный</th>
                <th className="text-center py-3 px-5 font-medium">
                  <MessageCircle className="w-4 h-4 inline" />
                </th>
                <th className="text-right py-3 px-5 font-medium">Создано</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: any) => {
                const st = ticketStatusConfig[ticket.status] || ticketStatusConfig.OPEN;
                const pr = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

                return (
                  <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-5">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="hover:underline"
                      >
                        <span className="font-mono text-xs text-muted-foreground block">
                          {ticket.number}
                        </span>
                        <span className="font-medium">{ticket.subject}</span>
                      </Link>
                      {ticket.order && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <FolderKanban className="w-3 h-3" />
                          {ticket.order.number}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5">{ticket.client?.name}</td>
                    <td className="py-3 px-5">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant={pr.variant}>{pr.label}</Badge>
                    </td>
                    <td className="py-3 px-5">
                      {ticket.assignee ? (
                        <span className="flex items-center gap-1 text-sm">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {ticket.assignee.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center text-muted-foreground">
                      {ticket._count.messages}
                    </td>
                    <td className="py-3 px-5 text-right text-muted-foreground">
                      {formatRelativeTime(ticket.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Обращений не найдено</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
