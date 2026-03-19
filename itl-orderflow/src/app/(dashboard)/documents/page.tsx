import { Suspense } from "react";
import Link from "next/link";
import {
  FileText,
  ClipboardList,
  FilePlus,
  Scale,
  Plus,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContracts } from "@/actions/contracts";
import { getTechSpecs } from "@/actions/tech-specs";
import { getAmendments } from "@/actions/amendments";
import { getReconciliations } from "@/actions/reconciliations";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

const tabs = [
  { key: "contracts", label: "Договоры", icon: FileText },
  { key: "specs", label: "Тех. задания", icon: ClipboardList },
  { key: "amendments", label: "Доп. соглашения", icon: FilePlus },
  { key: "reconciliations", label: "Акты сверки", icon: Scale },
];

const contractStatusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  ACTIVE: { label: "Активный", dot: "#22c55e" },
  COMPLETED: { label: "Завершён", dot: "#3b82f6" },
  TERMINATED: { label: "Расторгнут", dot: "#ef4444" },
  EXPIRED: { label: "Истёк", dot: "#f59e0b" },
};

const specStatusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  REVIEW: { label: "На проверке", dot: "#f59e0b" },
  APPROVED: { label: "Утверждено", dot: "#22c55e" },
  ARCHIVED: { label: "Архив", dot: "#6b7280" },
};

const amendmentStatusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  ACTIVE: { label: "Активный", dot: "#22c55e" },
  COMPLETED: { label: "Завершён", dot: "#3b82f6" },
};

const reconciliationStatusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  SENT: { label: "Отправлен", dot: "#3b82f6" },
  CONFIRMED: { label: "Подтверждён", dot: "#22c55e" },
};

interface DocumentsPageProps {
  searchParams: { tab?: string; search?: string; status?: string };
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const activeTab = searchParams.tab || "contracts";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Документы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Договоры, тех. задания, доп. соглашения и акты сверки
          </p>
        </div>
        <Link
          href={
            activeTab === "contracts"
              ? "/documents/contracts/new"
              : activeTab === "specs"
              ? "/documents/specs/new"
              : activeTab === "amendments"
              ? "/documents/amendments/new"
              : "/documents/reconciliations/new"
          }
        >
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Создать
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/documents?tab=${tab.key}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-background-light"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-12 text-center text-muted-foreground">
            Загрузка...
          </div>
        }
      >
        {activeTab === "contracts" && (
          <ContractsTable search={searchParams.search} status={searchParams.status} />
        )}
        {activeTab === "specs" && (
          <SpecsTable search={searchParams.search} status={searchParams.status} />
        )}
        {activeTab === "amendments" && (
          <AmendmentsTable search={searchParams.search} status={searchParams.status} />
        )}
        {activeTab === "reconciliations" && (
          <ReconciliationsTable search={searchParams.search} status={searchParams.status} />
        )}
      </Suspense>
    </div>
  );
}

async function ContractsTable({ search, status }: { search?: string; status?: string }) {
  const { contracts, total } = await getContracts({ search, status });

  return (
    <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
      {/* Search */}
      <div className="p-4 border-b border-[#dbdfe6]">
        <form method="GET" className="relative">
          <input type="hidden" name="tab" value="contracts" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Поиск по номеру или названию..."
            className="w-full pl-10 pr-4 py-2 border border-[#dbdfe6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#dbdfe6]">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Номер</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Название</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Клиент</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden lg:table-cell">Сумма</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Статус</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Дата</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c: any) => {
            const st = contractStatusMap[c.status] || contractStatusMap.DRAFT;
            return (
              <tr key={c.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                <td className="py-3 px-4 font-mono text-xs">{c.number}</td>
                <td className="py-3 px-4">
                  <Link href={`/documents/contracts/${c.id}`} className="font-medium hover:text-primary">
                    {c.title}
                  </Link>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{c.client?.name}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-right font-medium">
                  {formatCurrency(Number(c.totalAmount), c.currency)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                    <span className="text-xs">{st.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                  {formatDate(c.contractDate)}
                </td>
              </tr>
            );
          })}
          {contracts.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Договоры не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

async function SpecsTable({ search, status }: { search?: string; status?: string }) {
  const { specs, total } = await getTechSpecs({ search, status });

  return (
    <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
      <div className="p-4 border-b border-[#dbdfe6]">
        <form method="GET" className="relative">
          <input type="hidden" name="tab" value="specs" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Поиск по номеру или названию..."
            className="w-full pl-10 pr-4 py-2 border border-[#dbdfe6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#dbdfe6]">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Номер</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Название</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Клиент</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden lg:table-cell">Проект</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Статус</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Версия</th>
          </tr>
        </thead>
        <tbody>
          {specs.map((s: any) => {
            const st = specStatusMap[s.status] || specStatusMap.DRAFT;
            return (
              <tr key={s.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                <td className="py-3 px-4 font-mono text-xs">{s.number}</td>
                <td className="py-3 px-4">
                  <Link href={`/documents/specs/${s.id}`} className="font-medium hover:text-primary">
                    {s.title}
                  </Link>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{s.client?.name}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{s.order?.number || "—"}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                    <span className="text-xs">{st.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">{s.version}</td>
              </tr>
            );
          })}
          {specs.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Тех. задания не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

async function AmendmentsTable({ search, status }: { search?: string; status?: string }) {
  const { amendments, total } = await getAmendments({ search, status });

  return (
    <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
      <div className="p-4 border-b border-[#dbdfe6]">
        <form method="GET" className="relative">
          <input type="hidden" name="tab" value="amendments" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Поиск по номеру или названию..."
            className="w-full pl-10 pr-4 py-2 border border-[#dbdfe6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#dbdfe6]">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Номер</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Название</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Договор</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden lg:table-cell">Клиент</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Статус</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Дата</th>
          </tr>
        </thead>
        <tbody>
          {amendments.map((a: any) => {
            const st = amendmentStatusMap[a.status] || amendmentStatusMap.DRAFT;
            return (
              <tr key={a.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                <td className="py-3 px-4 font-mono text-xs">{a.number}</td>
                <td className="py-3 px-4">
                  <Link href={`/documents/amendments/${a.id}`} className="font-medium hover:text-primary">
                    {a.title}
                  </Link>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{a.contract?.number}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{a.contract?.client?.name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                    <span className="text-xs">{st.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                  {formatDate(a.effectiveDate)}
                </td>
              </tr>
            );
          })}
          {amendments.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-muted-foreground">
                <FilePlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Доп. соглашения не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

async function ReconciliationsTable({ search, status }: { search?: string; status?: string }) {
  const { reconciliations, total } = await getReconciliations({ search, status });

  return (
    <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
      <div className="p-4 border-b border-[#dbdfe6]">
        <form method="GET" className="relative">
          <input type="hidden" name="tab" value="reconciliations" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Поиск по номеру или клиенту..."
            className="w-full pl-10 pr-4 py-2 border border-[#dbdfe6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#dbdfe6]">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Номер</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Клиент</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Период</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden lg:table-cell">Сальдо</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Статус</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase hidden md:table-cell">Дата</th>
          </tr>
        </thead>
        <tbody>
          {reconciliations.map((r: any) => {
            const st = reconciliationStatusMap[r.status] || reconciliationStatusMap.DRAFT;
            return (
              <tr key={r.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                <td className="py-3 px-4 font-mono text-xs">{r.number}</td>
                <td className="py-3 px-4">
                  <Link href={`/documents/reconciliations/${r.id}`} className="font-medium hover:text-primary">
                    {r.client?.name}
                  </Link>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                  {formatDate(r.periodFrom)} — {formatDate(r.periodTo)}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell text-right font-medium">
                  {formatCurrency(r.closingBalance, r.currency)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                    <span className="text-xs">{st.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                  {formatDate(r.generatedDate)}
                </td>
              </tr>
            );
          })}
          {reconciliations.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-muted-foreground">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Акты сверки не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
