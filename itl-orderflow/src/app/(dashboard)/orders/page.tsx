import { Suspense } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  MoreHorizontal,
  LayoutGrid,
  List,
  FolderOpen,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getOrders, getOrderStatuses } from "@/actions/orders";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import { FilterSelect } from "@/components/filters/filter-select";

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Низкий", className: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Средний", className: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Высокий", className: "bg-amber-100 text-amber-700" },
  URGENT: { label: "Срочный", className: "bg-red-100 text-red-700" },
};

interface OrdersSearchParams {
  search?: string;
  statusId?: string;
  clientId?: string;
  managerId?: string;
  priority?: string;
  view?: string;
}

async function OrdersContent({
  search,
  statusId,
  clientId,
  managerId,
  view,
}: OrdersSearchParams) {
  const [{ orders, total }, statuses] = await Promise.all([
    getOrders({ search, statusId, clientId, managerId }),
    getOrderStatuses(),
  ]);

  const isKanban = view === "kanban";

  if (orders.length === 0) {
    return (
      <div className="border rounded-xl bg-white">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Пока нет заказов</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-8">
            Создайте первый заказ, чтобы начать работу с системой
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/orders/new">
              <Button>Создать заказ</Button>
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Узнать больше
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isKanban) {
    const getStatusOrders = (sid: string) =>
      orders.filter((o) => o.statusId === sid);

    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const statusOrders = getStatusOrders(status.id);
          return (
            <div key={status.id} className="flex-shrink-0 w-72">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium text-sm">{status.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {statusOrders.length}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {statusOrders.map((order) => {
                    const priority =
                      priorityConfig[order.priority] || priorityConfig.MEDIUM;
                    return (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs text-muted-foreground">
                                {order.number}
                              </span>
                              <Badge
                                className={`text-[10px] ${priority.className}`}
                              >
                                {priority.label}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">
                              {order.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {order.client?.name}
                            </p>
                            {order.progressPercent != null && (
                              <Progress
                                value={order.progressPercent}
                                className="h-1.5 mb-2"
                              />
                            )}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {order.deadline ? (
                                  <>
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(order.deadline)}
                                  </>
                                ) : (
                                  <span>
                                    {order._count?.tasks || 0} задач
                                  </span>
                                )}
                              </div>
                              {order.manager && (
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(order.manager.name || "")}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Table View
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  № / Название
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Клиент
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Статус
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Прогресс
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Приоритет
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Менеджер
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Дедлайн
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden xl:table-cell">
                  Бюджет
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const priority =
                  priorityConfig[order.priority] || priorityConfig.MEDIUM;
                return (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="py-4 px-6">
                      <Link href={`/orders/${order.id}`}>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            {order.number}
                          </span>
                          <div className="font-medium">{order.title}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {order.client?.name}
                    </td>
                    <td className="py-4 px-6">
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
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Progress
                          value={order.progressPercent || 0}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {order.progressPercent || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={priority.className}>
                        {priority.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      {order.manager && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(order.manager.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{order.manager.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm hidden md:table-cell">
                      {order.deadline ? formatDate(order.deadline) : "—"}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium hidden xl:table-cell">
                      {order.estimatedBudget
                        ? formatCurrency(
                            Number(order.estimatedBudget),
                            order.currency
                          )
                        : "—"}
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Показано {orders.length} из {total}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

async function OrdersHeader() {
  const [clients, managers] = await Promise.all([
    prisma.client.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CreateOrderDialog
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      managers={managers.map((m) => ({ id: m.id, name: m.name || "" }))}
    />
  );
}

async function OrdersFilters({
  searchParams,
}: {
  searchParams: OrdersSearchParams;
}) {
  const [statuses, clients, managers] = await Promise.all([
    getOrderStatuses(),
    prisma.client.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const currentView = searchParams.view || "table";

  return (
    <Card>
      <CardContent className="p-4">
        <form
          action="/orders"
          method="GET"
          className="flex flex-col gap-3"
        >
          {/* Search + View Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Поиск по номеру, названию или клиенту..."
                className="pl-9"
                defaultValue={searchParams.search}
              />
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <Link
                href={{
                  pathname: "/orders",
                  query: { ...searchParams, view: "table" },
                }}
                className={`p-2.5 ${currentView === "table" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                <List className="w-4 h-4" />
              </Link>
              <Link
                href={{
                  pathname: "/orders",
                  query: { ...searchParams, view: "kanban" },
                }}
                className={`p-2.5 ${currentView === "kanban" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-2">
            <input type="hidden" name="view" value={currentView} />
            <FilterSelect
              name="statusId"
              defaultValue={searchParams.statusId}
              placeholder="Все статусы"
              options={statuses.map((s) => ({ value: s.id, label: s.name }))}
            />

            <FilterSelect
              name="clientId"
              defaultValue={searchParams.clientId}
              placeholder="Все клиенты"
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
            />

            <FilterSelect
              name="managerId"
              defaultValue={searchParams.managerId}
              placeholder="Все менеджеры"
              options={managers.map((m) => ({ value: m.id, label: m.name || "" }))}
            />

            <FilterSelect
              name="priority"
              defaultValue={searchParams.priority}
              placeholder="Все приоритеты"
              options={[
                { value: "LOW", label: "Низкий" },
                { value: "MEDIUM", label: "Средний" },
                { value: "HIGH", label: "Высокий" },
                { value: "URGENT", label: "Срочный" },
              ]}
            />

            <Button type="submit" variant="secondary" size="sm">
              Найти
            </Button>

            {(searchParams.search ||
              searchParams.statusId ||
              searchParams.clientId ||
              searchParams.managerId ||
              searchParams.priority) && (
              <Link href={`/orders?view=${currentView}`}>
                <Button type="button" variant="ghost" size="sm">
                  Сбросить
                </Button>
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage({
  searchParams,
}: {
  searchParams: OrdersSearchParams;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Заказы</h1>
          <p className="text-muted-foreground text-sm">
            Управление заказами и проектами
          </p>
        </div>
        <Suspense fallback={<Button disabled>Создать заказ</Button>}>
          <OrdersHeader />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="p-4">
              <div className="h-10 bg-muted animate-pulse rounded-lg" />
            </CardContent>
          </Card>
        }
      >
        <OrdersFilters searchParams={searchParams} />
      </Suspense>

      {/* Content */}
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent
          search={searchParams.search}
          statusId={searchParams.statusId}
          clientId={searchParams.clientId}
          managerId={searchParams.managerId}
          view={searchParams.view}
        />
      </Suspense>
    </div>
  );
}
