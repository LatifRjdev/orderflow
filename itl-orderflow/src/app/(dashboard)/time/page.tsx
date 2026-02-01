import { Suspense } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTimeEntries, getWeeklyTimeGrid } from "@/actions/time-entries";
import { cn, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CreateTimeEntryDialog } from "@/components/time/create-time-entry-dialog";

function getWeekStart(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const ws = new Date(d);
  ws.setDate(diff);
  ws.setHours(0, 0, 0, 0);
  return ws;
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const months = [
    "янв", "фев", "мар", "апр", "мая", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек",
  ];
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()} — ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${months[weekStart.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
}

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

async function WeeklyGridContent({ weekStartStr }: { weekStartStr: string }) {
  const { rows, dayTotals, grandTotal } = await getWeeklyTimeGrid(weekStartStr);
  const weekStart = new Date(weekStartStr);

  // Generate day labels with dates
  const dayLabels = dayNames.map((name, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return { name, date: d.getDate() };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Недельная сетка</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground min-w-[200px]">
                  Проект
                </th>
                {dayLabels.map((dl, i) => (
                  <th
                    key={i}
                    className={cn(
                      "text-center py-3 px-2 text-sm font-medium min-w-[60px]",
                      i >= 5 ? "text-muted-foreground/60" : "text-muted-foreground"
                    )}
                  >
                    <div>{dl.name}</div>
                    <div className="text-xs font-normal">{dl.date}</div>
                  </th>
                ))}
                <th className="text-center py-3 px-3 text-sm font-medium text-muted-foreground">
                  Итого
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.order.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <span className="font-mono text-muted-foreground mr-1">
                        {row.order.number}
                      </span>
                      <span className="font-medium">{row.order.title}</span>
                    </div>
                  </td>
                  {row.days.map((hours, i) => (
                    <td
                      key={i}
                      className={cn(
                        "text-center py-3 px-2 text-sm",
                        hours > 0 ? "font-medium" : "text-muted-foreground/40"
                      )}
                    >
                      {hours > 0 ? hours : "—"}
                    </td>
                  ))}
                  <td className="text-center py-3 px-3 text-sm font-bold">
                    {row.total}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    Нет записей за эту неделю
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-gray-50/80">
                  <td className="py-3 px-4 text-sm font-bold">Итого</td>
                  {dayTotals.map((dt, i) => (
                    <td
                      key={i}
                      className={cn(
                        "text-center py-3 px-2 text-sm font-bold",
                        dt > 0 ? "" : "text-muted-foreground/40"
                      )}
                    >
                      {dt > 0 ? dt : "—"}
                    </td>
                  ))}
                  <td className="text-center py-3 px-3 text-sm font-bold text-primary">
                    {grandTotal}ч
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

async function TimeListContent() {
  const { entries, total, totalHours } = await getTimeEntries({ limit: 30 });

  // Group entries by order
  const byOrder: Record<string, { order: any; totalHours: number; entries: any[] }> = {};
  for (const entry of entries) {
    const key = entry.orderId;
    if (!byOrder[key]) {
      byOrder[key] = { order: entry.order, totalHours: 0, entries: [] };
    }
    byOrder[key].totalHours += entry.hours;
    byOrder[key].entries.push(entry);
  }
  const orderGroups = Object.values(byOrder).sort((a, b) => b.totalHours - a.totalHours);

  const billableHours = entries
    .filter((e) => e.isBillable)
    .reduce((sum, e) => sum + e.hours, 0);

  const weekNorm = 40;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">
              Всего часов
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{totalHours}</span>
              <span className="text-muted-foreground">ч</span>
            </div>
            <Progress
              value={Math.min((totalHours / weekNorm) * 100, 100)}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">
              Оплачиваемых часов
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{billableHours}</span>
              {totalHours > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round((billableHours / totalHours) * 100)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Проектов</div>
            <div className="text-3xl font-bold">{orderGroups.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* By Order Summary */}
      {orderGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">По проектам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderGroups.map((group) => (
              <div
                key={group.order?.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <span className="text-sm font-mono text-muted-foreground mr-2">
                    {group.order?.number}
                  </span>
                  <span className="font-medium">{group.order?.title}</span>
                </div>
                <Badge variant="secondary">{group.totalHours}ч</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Последние записи</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Дата
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Проект
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Сотрудник
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Описание
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-muted-foreground">
                    Часы
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="py-3 px-6 text-sm">
                      {formatDate(entry.date)}
                    </td>
                    <td className="py-3 px-6 text-sm">
                      <span className="font-mono text-muted-foreground mr-1">
                        {entry.order?.number}
                      </span>
                      {entry.order?.title}
                    </td>
                    <td className="py-3 px-6 text-sm">
                      {entry.user?.name}
                    </td>
                    <td className="py-3 px-6 text-sm text-muted-foreground">
                      {entry.description || "—"}
                    </td>
                    <td className="py-3 px-6 text-sm text-right font-medium">
                      {entry.hours}ч
                      {!entry.isBillable && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (внутр.)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Записей нет
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

function TimeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

async function TimeHeader() {
  const session = await auth();
  const userId = session?.user?.id || "";

  const orders = await prisma.order.findMany({
    select: { id: true, title: true, number: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex gap-2">
      <CreateTimeEntryDialog
        orders={orders.map((o) => ({ id: o.id, title: o.title, number: o.number }))}
        userId={userId}
      >
        <Button>
          <Clock className="w-4 h-4 mr-2" />
          Добавить запись
        </Button>
      </CreateTimeEntryDialog>
    </div>
  );
}

export default function TimePage({
  searchParams,
}: {
  searchParams: { view?: string; week?: string };
}) {
  const view = searchParams.view || "list";
  const weekStart = getWeekStart(searchParams.week);
  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Учёт времени</h1>
          <p className="text-muted-foreground text-sm">Записи о рабочем времени</p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={<Button disabled>Добавить запись</Button>}>
            <TimeHeader />
          </Suspense>
        </div>
      </div>

      {/* View Toggle + Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Link
            href={`/time?view=list${searchParams.week ? `&week=${searchParams.week}` : ""}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              view === "list"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
            Список
          </Link>
          <Link
            href={`/time?view=week${searchParams.week ? `&week=${searchParams.week}` : ""}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              view === "week"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Неделя
          </Link>
        </div>

        {view === "week" && (
          <div className="flex items-center gap-2">
            <Link href={`/time?view=week&week=${prevWeek.toISOString().split("T")[0]}`}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {formatWeekRange(weekStart)}
            </span>
            <Link href={`/time?view=week&week=${nextWeek.toISOString().split("T")[0]}`}>
              <Button variant="outline" size="icon">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/time?view=week`}>
              <Button variant="outline" size="sm">
                Сегодня
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <Suspense fallback={<TimeSkeleton />}>
        {view === "week" ? (
          <WeeklyGridContent weekStartStr={weekStart.toISOString()} />
        ) : (
          <TimeListContent />
        )}
      </Suspense>
    </div>
  );
}
