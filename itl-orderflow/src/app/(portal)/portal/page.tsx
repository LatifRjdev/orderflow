import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalDashboard } from "@/actions/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  Clock,
  DollarSign,
  FileText,
  ArrowRight,
  CheckCircle2,
  Circle,
  ScrollText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PortalDashboard() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const { orders, activeOrders, invoices, proposals, pendingProposals, stats } = await getPortalDashboard(client.id);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Добро пожаловать, {client.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Отслеживайте прогресс ваших проектов
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderKanban className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Проектов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCount}</p>
                <p className="text-sm text-muted-foreground">Активных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalInvoiced)}
                </p>
                <p className="text-sm text-muted-foreground">Выставлено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.outstanding)}
                </p>
                <p className="text-sm text-muted-foreground">К оплате</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-bold mb-4">Ваши проекты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order: any) => {
            const totalTasks = order._count?.tasks || 0;
            const isCompleted = order.status?.code === "completed";

            return (
              <Link key={order.id} href={`/portal/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {order.number}
                        </span>
                        <h3 className="font-medium mt-0.5">{order.title}</h3>
                      </div>
                      {order.status && (
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: order.status.color + "20",
                            color: order.status.color,
                            borderColor: order.status.color,
                          }}
                        >
                          {order.status.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      {order.deadline && (
                        <span>Дедлайн: {formatDate(order.deadline)}</span>
                      )}
                      <span>{totalTasks} задач</span>
                      <span>{order._count?.milestones || 0} этапов</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="text-sm">
                        {isCompleted ? "Завершён" : "В работе"}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {orders.length === 0 && (
            <Card className="col-span-2">
              <CardContent className="p-12 text-center text-muted-foreground">
                <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Проектов пока нет</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pending Proposals */}
      {proposals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              Коммерческие предложения
              {pendingProposals > 0 && (
                <Badge variant="default" className="ml-2">
                  {pendingProposals} новых
                </Badge>
              )}
            </h2>
            <Link
              href="/portal/proposals"
              className="text-sm text-primary hover:underline"
            >
              Все предложения
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-5 font-medium">Номер</th>
                    <th className="text-left py-3 px-5 font-medium">
                      Название
                    </th>
                    <th className="text-left py-3 px-5 font-medium">Статус</th>
                    <th className="text-right py-3 px-5 font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p: any) => {
                    const proposalStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning" }> = {
                      SENT: { label: "Новое", variant: "default" },
                      VIEWED: { label: "Просмотрено", variant: "secondary" },
                      ACCEPTED: { label: "Принято", variant: "success" },
                      REJECTED: { label: "Отклонено", variant: "destructive" },
                      EXPIRED: { label: "Истекло", variant: "warning" },
                    };
                    const st = proposalStatusLabels[p.status] || proposalStatusLabels.SENT;
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 px-5">
                          <Link
                            href={`/portal/proposals/${p.id}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {p.number}
                          </Link>
                        </td>
                        <td className="py-3 px-5">{p.title}</td>
                        <td className="py-3 px-5">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="py-3 px-5 text-right font-medium">
                          {formatCurrency(p.totalAmount, p.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Последние счета</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-5 font-medium">Номер</th>
                    <th className="text-left py-3 px-5 font-medium">Дата</th>
                    <th className="text-left py-3 px-5 font-medium">Статус</th>
                    <th className="text-right py-3 px-5 font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const statusLabels: Record<string, string> = {
                      DRAFT: "Черновик",
                      SENT: "Отправлен",
                      PAID: "Оплачен",
                      PARTIALLY_PAID: "Частично",
                      OVERDUE: "Просрочен",
                    };
                    return (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-3 px-5 font-mono">{inv.number}</td>
                        <td className="py-3 px-5">{formatDate(inv.issueDate)}</td>
                        <td className="py-3 px-5">
                          <Badge
                            variant={
                              inv.status === "PAID"
                                ? "success"
                                : inv.status === "OVERDUE"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {statusLabels[inv.status] || inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-5 text-right font-medium">
                          {formatCurrency(Number(inv.total), inv.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
