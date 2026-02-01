import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FolderKanban,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  CreditCard,
  Users,
  UserPlus,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/actions/dashboard";
import { formatDate, formatRelativeTime, getDaysUntilDeadline, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

async function DashboardContent() {
  const {
    activeOrders,
    totalOrders,
    urgentTasks,
    recentOrders,
    teamWorkload,
    totalWeekHours,
    statusChart,
    recentActivity,
  } = await getDashboardStats();

  const totalStatusCount = statusChart.reduce((sum, s) => sum + s.count, 0);

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
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Добавить клиента</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Создайте карточку первого клиента
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/orders">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <FolderKanban className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Создать заказ</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Оформите первый проект
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/settings">
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Настроить систему</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Название компании и параметры
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/orders">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активных проектов</p>
                  <p className="text-2xl font-bold mt-1">{activeOrders}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/orders">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего заказов</p>
                  <p className="text-2xl font-bold mt-1">{totalOrders}</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Срочных задач</p>
                  <p className="text-2xl font-bold mt-1">{urgentTasks.length}</p>
                </div>
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/time">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Часов за неделю</p>
                  <p className="text-2xl font-bold mt-1">{totalWeekHours}</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Статусы проектов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {totalStatusCount > 0 ? (
                <>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    {statusChart
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <div
                          key={s.name}
                          className="transition-all"
                          style={{
                            backgroundColor: s.color,
                            width: `${(s.count / totalStatusCount) * 100}%`,
                          }}
                          title={`${s.name}: ${s.count}`}
                        />
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {statusChart.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-muted-foreground">
                          {s.name} ({s.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Нет данных
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Срочные задачи
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentTasks.length > 0 ? (
              urgentTasks.map((task: any) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer block"
                >
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${
                      task.priority === "URGENT" ? "bg-destructive" : "bg-warning"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.order?.number || task.order?.title}
                    </p>
                  </div>
                  {task.dueDate && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {formatDate(task.dueDate)}
                    </Badge>
                  )}
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет срочных задач
              </p>
            )}
            <Link
              href="/tasks"
              className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
            >
              Все задачи <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Загрузка команды</CardTitle>
            <CardDescription>Часов за эту неделю</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamWorkload.length > 0 ? (
              teamWorkload.map((member: any) => (
                <div key={member.name} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground">{member.hours}ч</span>
                    </div>
                    <Progress value={(member.hours / 40) * 100} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет записей за эту неделю
              </p>
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ближайшие дедлайны</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium text-muted-foreground">
                        Проект
                      </th>
                      <th className="text-left py-3 font-medium text-muted-foreground">
                        Клиент
                      </th>
                      <th className="text-left py-3 font-medium text-muted-foreground">
                        Дедлайн
                      </th>
                      <th className="text-left py-3 font-medium text-muted-foreground">
                        Осталось
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order: any) => {
                      const daysLeft = getDaysUntilDeadline(order.deadline);
                      return (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="py-3">
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {order.title}
                            </Link>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {order.client?.name}
                          </td>
                          <td className="py-3">{formatDate(order.deadline)}</td>
                          <td className="py-3">
                            <Badge
                              variant={
                                daysLeft <= 3
                                  ? "destructive"
                                  : daysLeft <= 7
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {daysLeft <= 0
                                ? "Просрочен"
                                : `${daysLeft} дней`}
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
            <Link
              href="/orders"
              className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-4"
            >
              Все проекты <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Последняя активность</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-0">
              {recentActivity.map((item: any) => {
                const icons = {
                  comment: MessageSquare,
                  status: RefreshCw,
                  payment: CreditCard,
                };
                const colors = {
                  comment: "text-blue-500 bg-blue-50",
                  status: "text-purple-500 bg-purple-50",
                  payment: "text-green-500 bg-green-50",
                };
                const Icon = icons[item.type as keyof typeof icons];
                const colorClass = colors[item.type as keyof typeof colors];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-3 border-b last:border-0"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.text}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subtext}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(item.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет активности
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
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
