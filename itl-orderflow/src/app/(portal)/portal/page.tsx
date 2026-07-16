import Link from "next/link";
import { getPortalDashboard } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
import { ClearDeniedParam } from "@/components/portal/clear-denied-param";
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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: { denied?: string };
}) {
  const session = await requirePortalSession();
  const { permissions } = session;

  const { orders, invoices, proposals, pendingProposals, stats } = await getPortalDashboard();

  return (
    <div className="space-y-8">
      {searchParams.denied === "1" && (
        <>
          <ClearDeniedParam />
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">
            У вас нет доступа к этому разделу. Обратитесь к вашему менеджеру.
          </div>
        </>
      )}

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Добро пожаловать, {session.contact.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Отслеживайте прогресс ваших проектов
        </p>
      </div>

      {/* Stats */}
      {(permissions.canViewProjects || permissions.canViewFinance) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {permissions.canViewProjects && (
            <>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">Проектов</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeCount}</p>
                    <p className="text-sm text-muted-foreground">Активных</p>
                  </div>
                </div>
              </div>
            </>
          )}
          {permissions.canViewFinance && (
            <>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
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
              </div>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
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
              </div>
            </>
          )}
        </div>
      )}

      {/* Projects */}
      {permissions.canViewProjects && (
        <div>
          <h2 className="text-lg font-bold mb-4">Ваши проекты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order: any) => {
              const allTasks = [
                ...(order.tasks || []),
                ...(order.milestones?.flatMap((m: any) => m.tasks || []) || []),
              ];
              const doneTasks = allTasks.filter((t: any) => t.status === "DONE").length;
              const totalTasks = allTasks.length;
              const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
              const isCompleted = order.status?.code === "completed";

              return (
                <Link key={order.id} href={`/portal/orders/${order.id}`}>
                  <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {order.number}
                        </span>
                        <h3 className="font-medium mt-0.5">{order.title}</h3>
                      </div>
                      {order.status && (
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                          style={{
                            backgroundColor: order.status.color + "10",
                            color: order.status.color,
                            borderColor: order.status.color + "40",
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: order.status.color }} />
                          {order.status.name}
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-3">
                      <Progress value={progressPercent} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-10 text-right">{progressPercent}%</span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {order.deadline && (
                        <span>Дедлайн: {formatDate(order.deadline)}</span>
                      )}
                      <span>{doneTasks}/{totalTasks} задач</span>
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
                  </div>
                </Link>
              );
            })}
            {orders.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-12 text-center text-muted-foreground">
                <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Проектов пока нет</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Proposals */}
      {permissions.canViewProposals && proposals.length > 0 && (
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
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dbdfe6] bg-background-light">
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Название
                  </th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p: any) => {
                  const proposalStatusDots: Record<string, { label: string; dot: string }> = {
                    SENT: { label: "Новое", dot: "#3b82f6" },
                    VIEWED: { label: "Просмотрено", dot: "#8b5cf6" },
                    ACCEPTED: { label: "Принято", dot: "#22c55e" },
                    REJECTED: { label: "Отклонено", dot: "#ef4444" },
                    EXPIRED: { label: "Истекло", dot: "#f59e0b" },
                  };
                  const st = proposalStatusDots[p.status] || proposalStatusDots.SENT;
                  return (
                    <tr key={p.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors">
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
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                          <span className="text-sm">{st.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-medium">
                        {formatCurrency(p.totalAmount, p.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {permissions.canViewFinance && invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Последние счета</h2>
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dbdfe6] bg-background-light">
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const invoiceStatusDots: Record<string, { label: string; dot: string }> = {
                    DRAFT: { label: "Черновик", dot: "#9ca3af" },
                    SENT: { label: "Отправлен", dot: "#3b82f6" },
                    PAID: { label: "Оплачен", dot: "#22c55e" },
                    PARTIALLY_PAID: { label: "Частично", dot: "#f59e0b" },
                    OVERDUE: { label: "Просрочен", dot: "#ef4444" },
                  };
                  const st = invoiceStatusDots[inv.status] || invoiceStatusDots.DRAFT;
                  return (
                    <tr key={inv.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors">
                      <td className="py-3 px-5 font-mono">{inv.number}</td>
                      <td className="py-3 px-5">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                          <span className="text-sm">{st.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-medium">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
