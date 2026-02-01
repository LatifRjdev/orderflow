import { Suspense } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getProposals } from "@/actions/proposals";

const statusTabs = [
  { key: "", label: "Все" },
  { key: "DRAFT", label: "Черновики" },
  { key: "SENT", label: "Отправленные" },
  { key: "ACCEPTED", label: "Принятые" },
  { key: "REJECTED", label: "Отклонённые" },
];

const proposalStatusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Черновик", color: "bg-gray-100 text-gray-700" },
  SENT: { label: "Отправлено", color: "bg-blue-100 text-blue-700" },
  VIEWED: { label: "Просмотрено", color: "bg-purple-100 text-purple-700" },
  ACCEPTED: { label: "Принято", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Отклонено", color: "bg-red-100 text-red-700" },
  EXPIRED: { label: "Истекло", color: "bg-amber-100 text-amber-700" },
};

async function ProposalsContent({
  search,
  status,
}: {
  search?: string;
  status?: string;
}) {
  const { proposals, total, stats } = await getProposals({ search, status });

  const conversionRate =
    stats.sent + stats.accepted + stats.rejected > 0
      ? Math.round(
          (stats.accepted / (stats.sent + stats.accepted + stats.rejected)) * 100
        )
      : 0;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Отправлено</p>
                <p className="text-xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Просмотрено</p>
                <p className="text-xl font-bold">{stats.viewed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Принято</p>
                <p className="text-xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Конверсия</p>
                <p className="text-xl font-bold">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Коммерческие предложения
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({total})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    № КП
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Название
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Клиент
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Проект
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                    Сумма
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Статус
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Дата
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => {
                  const st =
                    proposalStatusMap[proposal.status] || proposalStatusMap.DRAFT;
                  return (
                    <tr
                      key={proposal.id}
                      className="border-b last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="py-4 px-6">
                        <Link href={`/proposals/${proposal.id}`}>
                          <span className="font-medium font-mono hover:text-primary">
                            {proposal.number}
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {proposal.title}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {proposal.client?.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground hidden md:table-cell">
                        {proposal.order?.number || "—"}
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        {formatCurrency(proposal.totalAmount, proposal.currency)}
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={cn("text-xs", st.color)}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground hidden lg:table-cell">
                        {formatDate(proposal.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <Link href={`/proposals/${proposal.id}`}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {proposals.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Коммерческих предложений пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ProposalsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

export default function ProposalsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Коммерческие предложения</h1>
          <p className="text-muted-foreground text-sm">
            Управление КП для клиентов
          </p>
        </div>
        <Link href="/proposals/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Создать КП
          </Button>
        </Link>
      </div>

      {/* Tabs + Search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto">
            {statusTabs.map((tab) => (
              <Link
                key={tab.key}
                href={`/proposals?${new URLSearchParams({
                  ...(tab.key ? { status: tab.key } : {}),
                  ...(searchParams.search
                    ? { search: searchParams.search }
                    : {}),
                }).toString()}`}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  (searchParams.status || "") === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <form action="/proposals" method="GET">
            {searchParams.status && (
              <input type="hidden" name="status" value={searchParams.status} />
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Поиск по номеру, названию или клиенту... (Enter)"
                className="pl-9"
                defaultValue={searchParams.search}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Content */}
      <Suspense fallback={<ProposalsSkeleton />}>
        <ProposalsContent
          search={searchParams.search}
          status={searchParams.status}
        />
      </Suspense>
    </div>
  );
}
