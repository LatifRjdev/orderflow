import { Suspense } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  FileSpreadsheet,
  DollarSign,
  Briefcase,
  Filter,
  CalendarDays,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency } from "@/lib/utils";
import {
  getRevenueByMonth,
  getWorkloadReport,
  getProjectTypeStats,
  getTopClients,
  getSalesFunnel,
  getFinanceSummary,
  getSalesFunnelDetailed,
} from "@/actions/reports";
import {
  RevenueChart,
  FunnelChart,
  WorkloadChart,
  ProjectTypesChart,
  ConversionTrendChart,
} from "@/components/reports/charts";
import TeamWorkloadDetail from "@/components/reports/team-workload-detail";

async function ReportsContent() {
  const [revenue, workload, projectTypes, topClients, funnel, financeSummary] =
    await Promise.all([
      getRevenueByMonth(12),
      getWorkloadReport("month"),
      getProjectTypeStats(),
      getTopClients(5),
      getSalesFunnel(),
      getFinanceSummary(),
    ]);

  return (
    <>
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Всего выставлено</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(financeSummary.totalInvoiced)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Оплачено</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {formatCurrency(financeSummary.totalPaid)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ожидает оплаты</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">
                {formatCurrency(financeSummary.totalPending)}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold">Выручка по месяцам</h3>
          </div>
          <div className="px-6 pb-6">
            {revenue.some((r) => r.amount > 0) ? (
              <RevenueChart data={revenue} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Нет данных о платежах
              </p>
            )}
          </div>
        </div>

        {/* Sales Funnel */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold">Воронка проектов</h3>
          </div>
          <div className="px-6 pb-6">
            {funnel.some((f) => f.count > 0) ? (
              <FunnelChart data={funnel} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Нет данных
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Загрузка команды (месяц)
            </h3>
          </div>
          <div className="px-6 pb-6">
            {workload.length > 0 ? (
              <div className="space-y-4">
                <WorkloadChart data={workload} />
                <div className="space-y-3 mt-4">
                  {workload.map((w) => (
                    <div key={w.userId} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{w.name}</span>
                          <span className="text-muted-foreground">
                            {w.totalHours}ч ({w.utilization}%)
                          </span>
                        </div>
                        <Progress value={Math.min(w.utilization, 100)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Нет записей за этот месяц
              </p>
            )}
          </div>
        </div>

        {/* Project Types */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Типы проектов
            </h3>
          </div>
          <div className="px-6 pb-6">
            {projectTypes.length > 0 ? (
              <ProjectTypesChart data={projectTypes} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Нет данных
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold">Топ клиенты по выручке</h3>
        </div>
        <div className="px-6 pb-6">
          {topClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dbdfe6]">
                    <th className="text-left py-3 font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="text-left py-3 font-medium text-muted-foreground">
                      Клиент
                    </th>
                    <th className="text-right py-3 font-medium text-muted-foreground">
                      Выручка
                    </th>
                    <th className="text-right py-3 font-medium text-muted-foreground">
                      Счетов
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((client, idx) => (
                    <tr key={client.id} className="border-b border-[#dbdfe6] last:border-0">
                      <td className="py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(client.revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="secondary">{client.invoices}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет данных об оплатах
            </p>
          )}
        </div>
      </div>

      {/* CSV Export */}
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Экспорт данных (CSV)
          </h3>
        </div>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Учёт времени",
                description: "Записи времени за текущий месяц",
                href: "/api/export/time-entries",
                withDates: true,
              },
              {
                title: "Счета и платежи",
                description: "Все счета с суммами и статусами",
                href: "/api/export/invoices",
                withDates: false,
              },
              {
                title: "Клиентская база",
                description: "Список клиентов с контактами",
                href: "/api/export/clients",
                withDates: false,
              },
            ].map((item) => {
              let url = item.href;
              if (item.withDates) {
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                  .toISOString()
                  .slice(0, 10);
                const endDate = now.toISOString().slice(0, 10);
                url += `?startDate=${startDate}&endDate=${endDate}`;
              }
              return (
                <div key={item.title} className="p-4 rounded-lg border border-[#dbdfe6] bg-background-light/30">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Sales Funnel Detail View ---

async function SalesFunnelContent() {
  const data = await getSalesFunnelDetailed();
  const { stages, kpi, monthlyConversion } = data;

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Конверсия</p>
              <p className="text-3xl font-bold mt-1">
                {kpi.conversionRate}%
              </p>
              <span className="inline-flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                {kpi.completedOrders} из {kpi.totalOrders} заказов
              </span>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Target className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Средний цикл сделки</p>
              <p className="text-3xl font-bold mt-1">
                {kpi.avgCycleDays} {kpi.avgCycleDays === 1 ? "день" : kpi.avgCycleDays >= 2 && kpi.avgCycleDays <= 4 ? "дня" : "дней"}
              </p>
              <span className="inline-flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                От создания до завершения
              </span>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <CalendarDays className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Средний чек</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(kpi.avgDealValue)}
              </p>
              <span className="inline-flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                Средний бюджет заказа
              </span>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Воронка продаж
          </h3>
        </div>
        <div className="px-6 pb-6">
          {stages.some((s) => s.count > 0) ? (
            <div className="space-y-3">
              {stages.map((stage, idx) => {
                const widthPercent = Math.max(
                  (stage.count / maxCount) * 100,
                  8
                );
                return (
                  <div key={stage.code} className="flex items-center gap-4">
                    <div className="w-40 shrink-0 text-sm font-medium text-right">
                      {stage.name}
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className="h-10 rounded-md flex items-center px-3 transition-all"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: stage.color,
                          minWidth: "60px",
                        }}
                      >
                        <span className="text-white text-sm font-semibold whitespace-nowrap">
                          {stage.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-14 shrink-0 text-sm text-muted-foreground text-right">
                      {stage.percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Нет данных
            </p>
          )}
        </div>
      </div>

      {/* Conversion Trend + Monthly Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Trend Chart */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Тренд конверсии
            </h3>
          </div>
          <div className="px-6 pb-6">
            {monthlyConversion.some((m) => m.totalOrders > 0) ? (
              <ConversionTrendChart data={monthlyConversion} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Нет данных
              </p>
            )}
          </div>
        </div>

        {/* Conversion by Period Table */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold">Конверсия по месяцам</h3>
          </div>
          <div className="px-6 pb-6">
            {monthlyConversion.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#dbdfe6]">
                      <th className="text-left py-3 font-medium text-muted-foreground">
                        Период
                      </th>
                      <th className="text-right py-3 font-medium text-muted-foreground">
                        Заказов
                      </th>
                      <th className="text-right py-3 font-medium text-muted-foreground">
                        Завершено
                      </th>
                      <th className="text-right py-3 font-medium text-muted-foreground">
                        Конверсия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyConversion.map((m) => (
                      <tr key={m.month} className="border-b border-[#dbdfe6] last:border-0">
                        <td className="py-3 font-medium">{m.month}</td>
                        <td className="py-3 text-right">{m.totalOrders}</td>
                        <td className="py-3 text-right">{m.completedOrders}</td>
                        <td className="py-3 text-right">
                          <Badge
                            variant="secondary"
                            className={cn(
                              m.conversionRate >= 50
                                ? "bg-green-100 text-green-700"
                                : m.conversionRate >= 25
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {m.conversionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Нет данных
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Skeletons ---

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        <div className="h-80 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
      </div>
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        ))}
      </div>
      <div className="h-80 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        <div className="h-80 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
      </div>
    </div>
  );
}

// --- Main Page ---

export default function ReportsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const activeView = searchParams.view === "funnel" ? "funnel" : searchParams.view === "workload" ? "workload" : "overview";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Отчёты</h1>
        <p className="text-muted-foreground text-sm">
          Аналитика, графики и экспорт данных
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Link
          href="/reports"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeView === "overview"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:bg-gray-50 border border-[#dbdfe6]"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Обзор
        </Link>
        <Link
          href="/reports?view=funnel"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeView === "funnel"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:bg-gray-50 border border-[#dbdfe6]"
          )}
        >
          <Filter className="w-4 h-4" />
          Воронка продаж
        </Link>
        <Link
          href="/reports?view=workload"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeView === "workload"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:bg-gray-50 border border-[#dbdfe6]"
          )}
        >
          <Users className="w-4 h-4" />
          Нагрузка команды
        </Link>
      </div>

      {activeView === "overview" ? (
        <Suspense fallback={<ReportsSkeleton />}>
          <ReportsContent />
        </Suspense>
      ) : activeView === "funnel" ? (
        <Suspense fallback={<FunnelSkeleton />}>
          <SalesFunnelContent />
        </Suspense>
      ) : (
        <Suspense fallback={<ReportsSkeleton />}>
          <TeamWorkloadDetail />
        </Suspense>
      )}
    </div>
  );
}
