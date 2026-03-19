import { Suspense } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  DollarSign,
  MoreHorizontal,
  BarChart3,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getInvoices, getPaymentForecast, getOverdueInvoices } from "@/actions/invoices";
import { getRevenueByMonth, getFinanceSummary, getTopClients } from "@/actions/reports";
import { RevenueByMonthChart } from "@/components/finance/finance-charts";

const invoiceStatusMap: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT: { label: "Черновик", color: "bg-gray-100 text-gray-700", dot: "#9ca3af" },
  SENT: { label: "Отправлен", color: "bg-blue-100 text-blue-700", dot: "#3b82f6" },
  VIEWED: { label: "Просмотрен", color: "bg-purple-100 text-purple-700", dot: "#8b5cf6" },
  PAID: { label: "Оплачен", color: "bg-green-100 text-green-700", dot: "#22c55e" },
  PARTIALLY_PAID: { label: "Частично", color: "bg-amber-100 text-amber-700", dot: "#f59e0b" },
  OVERDUE: { label: "Просрочен", color: "bg-red-100 text-red-700", dot: "#ef4444" },
  CANCELLED: { label: "Отменён", color: "bg-gray-100 text-gray-500", dot: "#9ca3af" },
};

const statusTabs = [
  { key: "", label: "Все" },
  { key: "DRAFT", label: "Черновики" },
  { key: "SENT", label: "Отправленные" },
  { key: "PAID", label: "Оплаченные" },
  { key: "OVERDUE", label: "Просроченные" },
];

// --- Dashboard Content (server component) ---

async function FinanceDashboardContent() {
  const [summary, revenueData, topClients, { invoices: recentInvoices }, forecast, overdueList] = await Promise.all([
    getFinanceSummary(),
    getRevenueByMonth(12),
    getTopClients(5),
    getInvoices({ limit: 10 }),
    getPaymentForecast(5),
    getOverdueInvoices(5),
  ]);

  const revenue = summary.totalPaid;
  const expenses = 0; // Expenses are not tracked in the current system
  const overdue = summary.totalInvoiced - summary.totalPaid - summary.totalPending;
  const netProfit = revenue - expenses;

  // Derive recent payments from paid/partially_paid invoices
  const recentPaid = recentInvoices
    .filter((inv) => inv.status === "PAID" || inv.status === "PARTIALLY_PAID")
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Выручка</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(revenue)}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                <TrendingUp className="w-3 h-3" />
                Оплаченные счета
              </span>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Расходы</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(expenses)}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                Не отслеживаются
              </span>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Просрочено</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(overdue > 0 ? overdue : 0)}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                Требует внимания
              </span>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Чистая прибыль</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(netProfit)}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                Выручка - расходы
              </span>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold">Выручка по месяцам</h3>
        </div>
        <div className="p-6">
          {revenueData.length > 0 ? (
            <RevenueByMonthChart data={revenueData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Нет данных за указанный период
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold">Топ клиенты по выручке</h3>
          </div>
          <div className="px-6 pb-6">
            {topClients.length > 0 ? (
              <div className="space-y-4">
                {topClients.map((client, index) => {
                  const maxRevenue = topClients[0]?.revenue || 1;
                  const percentage = Math.round((client.revenue / maxRevenue) * 100);
                  return (
                    <div key={client.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          <span className="text-muted-foreground mr-2">{index + 1}.</span>
                          {client.name}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(client.revenue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {client.invoices} {client.invoices === 1 ? "счёт" : client.invoices < 5 ? "счёта" : "счетов"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Нет данных о клиентах
              </div>
            )}
          </div>
        </div>

        {/* Payment Forecast */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Прогноз поступлений
            </h3>
          </div>
          <div>
            {forecast.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dbdfe6]">
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">Счёт</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">Клиент</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">Срок</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-muted-foreground">Ожидаемая сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((inv) => (
                      <tr key={inv.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                        <td className="py-3 px-6 text-sm">
                          <Link href={`/finance/${inv.id}`} className="font-mono hover:text-primary">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-3 px-6 text-sm">{inv.client?.name || "—"}</td>
                        <td className="py-3 px-6 text-sm text-muted-foreground">
                          {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                        </td>
                        <td className="py-3 px-6 text-sm text-right font-medium text-green-600">
                          {formatCurrency(inv.remaining, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Нет ожидаемых платежей
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold">Последние операции</h3>
          </div>
          <div>
            {recentPaid.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dbdfe6]">
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">
                        Дата
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">
                        Клиент
                      </th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-muted-foreground">
                        Сумма
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPaid.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50"
                      >
                        <td className="py-3 px-6 text-sm text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="py-3 px-6 text-sm font-medium">
                          {inv.client?.name || "—"}
                        </td>
                        <td className="py-3 px-6 text-sm text-right">
                          <span className="text-green-600 font-semibold">
                            +{formatCurrency(inv.paidAmount, inv.currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Нет последних операций
              </div>
            )}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Просроченные счета
            </h3>
          </div>
          <div>
            {overdueList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dbdfe6]">
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">Счёт</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">Клиент</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground">Просрочен с</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-muted-foreground">Остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueList.map((inv) => (
                      <tr key={inv.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                        <td className="py-3 px-6 text-sm">
                          <Link href={`/finance/${inv.id}`} className="font-mono hover:text-primary">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-3 px-6 text-sm">{inv.client?.name || "—"}</td>
                        <td className="py-3 px-6 text-sm text-red-500 font-medium">
                          {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                        </td>
                        <td className="py-3 px-6 text-sm text-right font-medium text-red-600">
                          {formatCurrency(inv.remaining, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Нет просроченных счетов
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Invoice List Content (existing, server component) ---

async function FinanceContent({ search, status }: { search?: string; status?: string }) {
  const { invoices, total, totalAmount, paidAmount } = await getInvoices({ search, status });

  const pendingAmount = totalAmount - paidAmount;

  const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE");
  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)),
    0
  );

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Общая сумма</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(totalAmount)}
              </p>
              <span className="inline-flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                {total} счетов
              </span>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ожидает оплаты</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(pendingAmount)}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Просрочено</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(overdueAmount)}
              </p>
              <span className="inline-flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {overdueInvoices.length} счетов
              </span>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold">Счета</h3>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#dbdfe6]">
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  № счёта
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Клиент / Проект
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Дата
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Срок оплаты
                </th>
                <th className="text-right py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Сумма
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const status = invoiceStatusMap[invoice.status] || invoiceStatusMap.DRAFT;
                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link href={`/finance/${invoice.id}`}>
                        <span className="font-medium font-mono hover:text-primary">
                          {invoice.number}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-sm">
                          {invoice.client?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.order?.number} — {invoice.order?.title}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground hidden md:table-cell">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="py-4 px-6 text-sm hidden lg:table-cell">
                      <span
                        className={cn(
                          invoice.status === "OVERDUE" && "text-red-600 font-medium"
                        )}
                      >
                        {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div>
                        <div className="font-medium">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </div>
                        {invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount && (
                          <div className="text-xs text-muted-foreground">
                            Оплачено: {formatCurrency(invoice.paidAmount, invoice.currency)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.dot }} />
                        <span className="text-sm">{status.label}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/finance/${invoice.id}`}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Счетов пока нет</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// --- Skeletons ---

function FinanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        ))}
      </div>
      <div className="h-64 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        ))}
      </div>
      <div className="h-80 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
        <div className="h-64 bg-white animate-pulse rounded-xl border border-[#dbdfe6]" />
      </div>
    </div>
  );
}

// --- Header ---

function FinanceHeader() {
  return (
    <Link href="/finance/new">
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Создать счёт
      </Button>
    </Link>
  );
}

// --- Main Page ---

export default function FinancePage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; view?: string };
}) {
  const activeView = searchParams.view === "invoices" ? "invoices" : "dashboard";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-muted-foreground text-sm">
            Управление счетами и платежами
          </p>
        </div>
        <FinanceHeader />
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Link
          href="/finance?view=dashboard"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeView === "dashboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:bg-gray-50 border border-[#dbdfe6]"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Дашборд
        </Link>
        <Link
          href="/finance?view=invoices"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeView === "invoices"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:bg-gray-50 border border-[#dbdfe6]"
          )}
        >
          <FileText className="w-4 h-4" />
          Счета
        </Link>
      </div>

      {activeView === "dashboard" ? (
        /* Dashboard View */
        <Suspense fallback={<DashboardSkeleton />}>
          <FinanceDashboardContent />
        </Suspense>
      ) : (
        /* Invoices View */
        <>
          {/* Status Tabs + Search */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-4 space-y-4">
            <div className="flex gap-2 overflow-x-auto">
              {statusTabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={`/finance?${new URLSearchParams({
                    view: "invoices",
                    ...(tab.key ? { status: tab.key } : {}),
                    ...(searchParams.search ? { search: searchParams.search } : {}),
                  }).toString()}`}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    (searchParams.status || "") === tab.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background-light text-muted-foreground hover:bg-gray-200"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <form action="/finance" method="GET">
              <input type="hidden" name="view" value="invoices" />
              {searchParams.status && (
                <input type="hidden" name="status" value={searchParams.status} />
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Поиск по номеру или клиенту... (Enter)"
                  className="pl-9"
                  defaultValue={searchParams.search}
                />
              </div>
            </form>
          </div>

          {/* Invoice List Content */}
          <Suspense fallback={<FinanceSkeleton />}>
            <FinanceContent search={searchParams.search} status={searchParams.status} />
          </Suspense>
        </>
      )}
    </div>
  );
}
