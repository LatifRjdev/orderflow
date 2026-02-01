import { Suspense } from "react";
import Link from "next/link";
import {
  Search,
  CheckSquare,
  Clock,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { getTasks } from "@/actions/tasks";
import { prisma } from "@/lib/prisma";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { FilterSelect } from "@/components/filters/filter-select";

const taskStatuses = [
  { id: "TODO", name: "К выполнению", color: "bg-gray-500" },
  { id: "IN_PROGRESS", name: "В работе", color: "bg-blue-500" },
  { id: "REVIEW", name: "На проверке", color: "bg-purple-500" },
  { id: "DONE", name: "Готово", color: "bg-green-500" },
];

const priorityColors: Record<string, string> = {
  LOW: "border-l-gray-400",
  MEDIUM: "border-l-blue-500",
  HIGH: "border-l-amber-500",
  URGENT: "border-l-red-500",
};

const priorityLabels: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочный",
};

interface TasksSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  view?: string;
}

async function TasksContent({
  search,
  status,
  priority,
  assigneeId,
  view,
}: TasksSearchParams) {
  const { tasks, total } = await getTasks({
    search,
    status,
    priority,
    assigneeId,
  });

  const isKanban = view !== "table";

  if (isKanban) {
    const filteredStatuses = status
      ? taskStatuses.filter((s) => s.id === status)
      : taskStatuses;

    return (
      <>
        <p className="text-muted-foreground text-sm -mt-4 mb-4">
          Всего: {total} задач
        </p>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredStatuses.map((st) => {
            const statusTasks = tasks.filter((t) => t.status === st.id);
            return (
              <div key={st.id} className="flex-shrink-0 w-80">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${st.color}`} />
                      <span className="font-medium text-sm">{st.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {statusTasks.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {statusTasks.map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <Card
                          className={cn(
                            "cursor-pointer hover:shadow-md transition-shadow border-l-4 mb-2",
                            priorityColors[task.priority] ||
                              priorityColors.MEDIUM
                          )}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {task.order?.number}
                                </span>
                              </div>
                            </div>
                            <h4 className="font-medium text-sm mb-3">
                              {task.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {task.estimatedHours && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {Number(task.estimatedHours)}ч
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span>{formatDate(task.dueDate)}</span>
                                )}
                              </div>
                              {task.assignee && (
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(task.assignee.name || "")}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {statusTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Нет задач
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // Table View — grouped by order
  const grouped: Record<
    string,
    { order: any; tasks: typeof tasks }
  > = {};
  for (const task of tasks) {
    const key = task.orderId;
    if (!grouped[key]) {
      grouped[key] = { order: task.order, tasks: [] };
    }
    grouped[key].tasks.push(task);
  }
  const groups = Object.values(grouped);

  return (
    <>
      <p className="text-muted-foreground text-sm -mt-4 mb-4">
        Всего: {total} задач
      </p>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Задача
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Статус
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">
                    Приоритет
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Исполнитель
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Срок
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-muted-foreground hidden xl:table-cell">
                    Часы
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <>
                    <tr
                      key={`header-${group.order?.id}`}
                      className="bg-gray-50"
                    >
                      <td
                        colSpan={6}
                        className="py-2 px-6 text-sm font-medium"
                      >
                        <Link
                          href={`/orders/${group.order?.id}`}
                          className="hover:text-primary"
                        >
                          <span className="font-mono text-muted-foreground mr-2">
                            {group.order?.number}
                          </span>
                          {group.order?.title}
                          <Badge
                            variant="secondary"
                            className="ml-2 text-xs"
                          >
                            {group.tasks.length}
                          </Badge>
                        </Link>
                      </td>
                    </tr>
                    {group.tasks.map((task) => {
                      const st = taskStatuses.find(
                        (s) => s.id === task.status
                      );
                      return (
                        <tr
                          key={task.id}
                          className="border-b last:border-0 hover:bg-gray-50/50"
                        >
                          <td className="py-3 px-6">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="font-medium text-sm hover:text-primary"
                            >
                              {task.title}
                            </Link>
                            {task.milestone && (
                              <p className="text-xs text-muted-foreground">
                                {task.milestone.title}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-6">
                            {st && (
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${st.color}`}
                                />
                                <span className="text-sm">{st.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-6">
                            <Badge
                              className={cn(
                                "text-xs",
                                task.priority === "URGENT" &&
                                  "bg-red-100 text-red-700",
                                task.priority === "HIGH" &&
                                  "bg-amber-100 text-amber-700",
                                task.priority === "MEDIUM" &&
                                  "bg-blue-100 text-blue-700",
                                task.priority === "LOW" &&
                                  "bg-gray-100 text-gray-700"
                              )}
                            >
                              {priorityLabels[task.priority] || task.priority}
                            </Badge>
                          </td>
                          <td className="py-3 px-6 hidden md:table-cell">
                            {task.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(task.assignee.name || "")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {task.assignee.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-sm hidden lg:table-cell">
                            {task.dueDate
                              ? formatDate(task.dueDate)
                              : "—"}
                          </td>
                          <td className="py-3 px-6 text-sm text-right hidden xl:table-cell">
                            {task.estimatedHours
                              ? `${Number(task.estimatedHours)}ч`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Задач нет
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

function TasksSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-80">
          <div className="bg-gray-100 rounded-lg p-3 space-y-2">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function TasksHeader() {
  const [orders, users] = await Promise.all([
    prisma.order.findMany({
      select: { id: true, title: true, number: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CreateTaskDialog
      orders={orders.map((o) => ({
        id: o.id,
        title: o.title,
        number: o.number,
      }))}
      users={users.map((u) => ({ id: u.id, name: u.name || "" }))}
    />
  );
}

async function TasksFilters({
  searchParams,
}: {
  searchParams: TasksSearchParams;
}) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const currentView = searchParams.view || "kanban";

  return (
    <Card>
      <CardContent className="p-4">
        <form action="/tasks" method="GET" className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Поиск задач..."
                className="pl-9"
                defaultValue={searchParams.search}
              />
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <Link
                href={{
                  pathname: "/tasks",
                  query: { ...searchParams, view: "kanban" },
                }}
                className={`p-2.5 ${currentView !== "table" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Link>
              <Link
                href={{
                  pathname: "/tasks",
                  query: { ...searchParams, view: "table" },
                }}
                className={`p-2.5 ${currentView === "table" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                <List className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input type="hidden" name="view" value={currentView} />

            {/* Status tabs */}
            <div className="flex border rounded-lg overflow-hidden text-sm">
              <Link
                href={{
                  pathname: "/tasks",
                  query: {
                    ...searchParams,
                    status: undefined,
                  },
                }}
                className={`px-3 py-1.5 ${!searchParams.status ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                Все
              </Link>
              {taskStatuses.map((s) => (
                <Link
                  key={s.id}
                  href={{
                    pathname: "/tasks",
                    query: { ...searchParams, status: s.id },
                  }}
                  className={`px-3 py-1.5 ${searchParams.status === s.id ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                >
                  {s.name}
                </Link>
              ))}
            </div>

            <FilterSelect
              name="priority"
              defaultValue={searchParams.priority}
              placeholder="Все приоритеты"
              options={[
                { value: "URGENT", label: "Срочный" },
                { value: "HIGH", label: "Высокий" },
                { value: "MEDIUM", label: "Средний" },
                { value: "LOW", label: "Низкий" },
              ]}
            />

            <FilterSelect
              name="assigneeId"
              defaultValue={searchParams.assigneeId}
              placeholder="Все исполнители"
              options={users.map((u) => ({ value: u.id, label: u.name || "" }))}
            />

            <Button type="submit" variant="secondary" size="sm">
              Найти
            </Button>

            {(searchParams.search ||
              searchParams.status ||
              searchParams.priority ||
              searchParams.assigneeId) && (
              <Link href={`/tasks?view=${currentView}`}>
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

export default function TasksPage({
  searchParams,
}: {
  searchParams: TasksSearchParams;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
        </div>
        <Suspense fallback={<Button disabled>Добавить задачу</Button>}>
          <TasksHeader />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-4">
              <div className="h-10 bg-muted animate-pulse rounded-lg" />
            </CardContent>
          </Card>
        }
      >
        <TasksFilters searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<TasksSkeleton />}>
        <TasksContent
          search={searchParams.search}
          status={searchParams.status}
          priority={searchParams.priority}
          assigneeId={searchParams.assigneeId}
          view={searchParams.view}
        />
      </Suspense>
    </div>
  );
}
