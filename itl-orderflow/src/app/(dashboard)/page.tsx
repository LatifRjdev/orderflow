import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FolderKanban,
  CheckCircle,
  DollarSign,
  Clock,
  MessageSquare,
  RefreshCw,
  CreditCard,
  Users,
  UserPlus,
  Rocket,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/actions/dashboard";
import { getRevenueByMonth } from "@/actions/reports";
import { formatCurrency, formatDate, formatRelativeTime, getDaysUntilDeadline, getInitials } from "@/lib/utils";
import { RevenueByMonthChart } from "@/components/finance/finance-charts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBarChart } from "@/components/dashboard/status-bar-chart";

// Shared entrance animation for each dashboard section; disabled under prefers-reduced-motion.
function sectionAnim(delayMs: number, className: string) {
  return {
    className: `${className} animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none`,
    style: { animationDelay: `${delayMs}ms`, animationFillMode: "backwards" as const },
  };
}

async function DashboardContent() {
  const [stats, revenueData] = await Promise.all([
    getDashboardStats(),
    getRevenueByMonth(6),
  ]);

  const {
    activeOrders,
    totalOrders,
    urgentTasks,
    recentOrders,
    teamWorkload,
    totalWeekHours,
    hoursChangePercent,
    statusChart,
    recentActivity,
    monthRevenue,
    revenueChangePercent,
    outstandingAmount,
    overdueAmount,
    overdueList,
  } = stats;

  const activeStatuses = statusChart.filter((s) => s.count > 0);
  const totalStatusCount = statusChart.reduce((sum, s) => sum + s.count, 0);
  const revenueSparkline = revenueData.map((d) => ({ value: d.amount }));

  // Empty state — onboarding
  if (totalOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Rocket className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Добро пожаловать в OrderFlow!</h2>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Начните работу, добавив клиентов и создав первый заказ.
          Система поможет управлять проектами, задачами, временем и финансами.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <Link href="/clients">
            <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Добавить клиента</h3>
              <p className="text-xs text-muted-foreground mt-1">Создайте карточку первого клиента</p>
            </div>
          </Link>
          <Link href="/orders">
            <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                <FolderKanban className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Создать заказ</h3>
              <p className="text-xs text-muted-foreground mt-1">Оформите первый проект</p>
            </div>
          </Link>
          <Link href="/settings">
            <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">Настроить систему</h3>
              <p className="text-xs text-muted-foreground mt-1">Название компании и параметры</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards Row 1 */}
      <div {...sectionAnim(0, "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4")}>
        <KpiCard
          href="/orders"
          icon={<FolderKanban className="w-5 h-5" />}
          accent="blue"
          label="Активные проекты"
          value={String(activeOrders)}
        />
        <KpiCard
          href="/orders"
          icon={<CheckCircle className="w-5 h-5" />}
          accent="amber"
          label="На проверке"
          value={String(totalOrders)}
        />
        <KpiCard
          href="/finance"
          icon={<DollarSign className="w-5 h-5" />}
          accent="emerald"
          label="Выручка за месяц"
          value={formatCurrency(monthRevenue)}
          trendPercent={revenueChangePercent}
          sparkline={revenueSparkline}
        />
        <KpiCard
          href="/time"
          icon={<Clock className="w-5 h-5" />}
          accent="violet"
          label="Часы за неделю"
          value={`${totalWeekHours} ч.`}
          trendPercent={hoursChangePercent}
        />
      </div>

      {/* Row 2: Status Chart + Urgent Tasks */}
      <div {...sectionAnim(80, "grid grid-cols-1 lg:grid-cols-3 gap-6")}>
        {/* Project Status Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg">Статусы проектов</h3>
              <p className="text-gray-500 text-sm">Всего: {totalStatusCount} (Текущий месяц)</p>
            </div>
            <Link href="/orders" className="text-primary text-sm font-medium hover:underline">
              Детализация
            </Link>
          </div>
          {activeStatuses.length > 0 ? (
            <StatusBarChart data={activeStatuses} />
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Нет данных</p>
          )}
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <h3 className="font-bold text-lg mb-6">Срочные задачи</h3>
          <div className="space-y-3">
            {urgentTasks.length > 0 ? (
              urgentTasks.map((task: any) => {
                const isUrgent = task.priority === "URGENT";
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                      isUrgent
                        ? "border-red-100 bg-red-50/30 hover:bg-red-50/60"
                        : "border-orange-100 bg-orange-50/30 hover:bg-orange-50/60"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                        isUrgent ? "bg-red-500" : "bg-orange-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {task.order?.number || task.order?.title}
                      </p>
                    </div>
                    {task.dueDate && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                        isUrgent
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет срочных задач
              </p>
            )}
          </div>
          <Link
            href="/tasks"
            className="w-full mt-6 py-2 rounded-lg bg-background-light text-sm font-semibold text-gray-600 flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
          >
            Смотреть все задачи
          </Link>
        </div>
      </div>

      {/* Row 3: Team Workload + Activity */}
      <div {...sectionAnim(140, "grid grid-cols-1 lg:grid-cols-2 gap-6")}>
        {/* Team Workload */}
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Загрузка команды</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">Текущая неделя</span>
          </div>
          <div className="space-y-5">
            {teamWorkload.length > 0 ? (
              teamWorkload.map((member: any) => {
                const pct = Math.min(Math.round((member.hours / 40) * 100), 100);
                const barColor =
                  pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-primary" : "bg-emerald-500";
                return (
                  <div key={member.name} className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="text-xs bg-gray-200">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span>{member.name}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет записей за эту неделю
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <h3 className="font-bold text-lg mb-6">Последняя активность</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
              {recentActivity.map((item: any) => {
                const iconConfig = {
                  comment: { Icon: MessageSquare, bg: "bg-blue-50", text: "text-blue-600" },
                  status: { Icon: RefreshCw, bg: "bg-purple-50", text: "text-purple-600" },
                  payment: { Icon: CreditCard, bg: "bg-green-50", text: "text-green-600" },
                };
                const cfg = iconConfig[item.type as keyof typeof iconConfig];
                const Icon = cfg.Icon;
                return (
                  <div key={item.id} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-9 h-9 ${cfg.bg} ${cfg.text} rounded-full flex items-center justify-center ring-4 ring-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium">{item.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.subtext} &bull; {formatRelativeTime(item.date)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Нет активности</p>
          )}
        </div>
      </div>

      {/* Row 4: Revenue Chart + Financial Cards */}
      <div {...sectionAnim(200, "grid grid-cols-1 lg:grid-cols-3 gap-6")}>
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Выручка по месяцам</h3>
            <Link href="/reports" className="text-primary text-sm font-medium hover:underline">
              Отчёты
            </Link>
          </div>
          {revenueData.some((d) => d.amount > 0) ? (
            <RevenueByMonthChart data={revenueData} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет данных о платежах
            </p>
          )}
        </div>

        {/* Financial Cards Column */}
        <div className="space-y-6">
          {/* Financial KPI Mini Cards */}
          <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Ожидает оплаты</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(outstandingAmount)}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Просрочено</p>
                <p className="text-xl font-bold mt-1 text-destructive">{formatCurrency(overdueAmount)}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </div>

          {/* Overdue List */}
          <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Просроченные
            </h4>
            {overdueList.length > 0 ? (
              <div className="space-y-3">
                {overdueList.map((inv: any) => (
                  <Link
                    key={inv.id}
                    href={`/finance/${inv.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-mono">{inv.number}</p>
                      <p className="text-xs text-gray-500 truncate">{inv.clientName}</p>
                    </div>
                    <p className="text-sm font-medium text-destructive shrink-0">
                      {formatCurrency(inv.remaining, inv.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Нет просроченных</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 5: Deadlines */}
      <div {...sectionAnim(260, "bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Ближайшие дедлайны</h3>
          <Link href="/orders" className="text-primary text-sm font-medium hover:underline">
            Все проекты
          </Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Проект</th>
                  <th className="text-left py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Клиент</th>
                  <th className="text-left py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Дедлайн</th>
                  <th className="text-left py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Осталось</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => {
                  const daysLeft = getDaysUntilDeadline(order.deadline);
                  return (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <Link href={`/orders/${order.id}`} className="font-medium hover:text-primary">
                          {order.title}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-500">{order.client?.name}</td>
                      <td className="py-3">{formatDate(order.deadline)}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            daysLeft <= 3 ? "destructive" : daysLeft <= 7 ? "warning" : "success"
                          }
                        >
                          {daysLeft <= 0 ? "Просрочен" : `${daysLeft} дней`}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет проектов с дедлайнами
          </p>
        )}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        <div className="h-64 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
