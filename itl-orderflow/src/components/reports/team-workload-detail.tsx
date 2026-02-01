import { getWorkloadReport } from "@/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Lightbulb,
} from "lucide-react";
import { StackedWorkloadChart } from "./team-workload-chart";

// ---------- Shared type for the report row ----------
export type WorkloadRow = {
  userId: string;
  name: string;
  role: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  utilization: number;
  entries: number;
  orders: { title: string; number: string; hours: number }[];
};

// ---------- Role label helper ----------
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  DEVELOPER: "Разработчик",
  DESIGNER: "Дизайнер",
  QA: "Тестировщик",
  SALES: "Продажи",
};

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role;
}

// ---------- Utilization colour helper ----------
function utilizationColor(pct: number) {
  if (pct >= 100) return "text-red-600";
  if (pct >= 80) return "text-green-600";
  if (pct >= 50) return "text-yellow-600";
  return "text-muted-foreground";
}

function utilizationBadgeVariant(pct: number) {
  if (pct >= 100) return "destructive" as const;
  if (pct >= 80) return "success" as const;
  if (pct >= 50) return "warning" as const;
  return "secondary" as const;
}

// ---------- Main Server Component ----------
export default async function TeamWorkloadDetail() {
  const data: WorkloadRow[] = await getWorkloadReport("month");

  // KPI aggregates
  const totalHours = data.reduce((s, r) => s + r.totalHours, 0);
  const billableHours = data.reduce((s, r) => s + r.billableHours, 0);
  const avgUtilization =
    data.length > 0
      ? Math.round(data.reduce((s, r) => s + r.utilization, 0) / data.length)
      : 0;
  const activeEmployees = data.length;

  return (
    <div className="space-y-6">
      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие часы</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toLocaleString("ru-RU")}ч</div>
            <p className="text-xs text-muted-foreground">За текущий месяц</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Оплачиваемые часы</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableHours.toLocaleString("ru-RU")}ч</div>
            <p className="text-xs text-muted-foreground">
              {totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0}% от общих
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Утилизация команды</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilizationColor(avgUtilization)}`}>
              {avgUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">Среднее по команде</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">С записями за месяц</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Stacked Horizontal Bar Chart ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Часы по сотрудникам</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Нет данных за выбранный период
            </p>
          ) : (
            <StackedWorkloadChart
              data={data.map((r) => ({
                name: r.name,
                billable: r.billableHours,
                nonBillable: r.nonBillableHours,
              }))}
            />
          )}
        </CardContent>
      </Card>

      {/* ---- Utilization Table ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Утилизация сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Нет данных за выбранный период
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium">Сотрудник</th>
                    <th className="pb-3 pr-4 font-medium">Роль</th>
                    <th className="pb-3 pr-4 font-medium text-right">Всего</th>
                    <th className="pb-3 pr-4 font-medium text-right">Оплач.</th>
                    <th className="pb-3 pr-4 font-medium min-w-[180px]">Утилизация</th>
                    <th className="pb-3 font-medium">Топ заказы</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.userId} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{row.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{roleLabel(row.role)}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">{row.totalHours}ч</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{row.billableHours}ч</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(row.utilization, 100)}
                            className="h-2 flex-1"
                          />
                          <Badge variant={utilizationBadgeVariant(row.utilization)}>
                            {row.utilization}%
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.orders.slice(0, 3).map((o) => (
                            <Badge key={o.number} variant="outline" className="text-xs">
                              #{o.number} ({o.hours}ч)
                            </Badge>
                          ))}
                          {row.orders.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{row.orders.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- AI Recommendations (mock) ---- */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
              <span>
                Сотрудники с утилизацией выше 90% могут быть перегружены — рассмотрите
                перераспределение задач для снижения рисков выгорания.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
              <span>
                Доля неоплачиваемых часов превышает 30% у некоторых сотрудников — проведите
                аудит внутренних задач и определите возможности для оптимизации.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
              <span>
                Сотрудники с утилизацией ниже 50% могут быть недозагружены — рассмотрите
                назначение дополнительных проектов или обучающих задач.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
              <span>
                Рекомендуется еженедельный пересмотр загрузки команды для своевременного
                выявления дисбалансов и корректировки планов.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
