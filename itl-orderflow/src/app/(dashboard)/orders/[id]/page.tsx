import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrder, getOrderStatuses } from "@/actions/orders";
import { prisma } from "@/lib/prisma";
import { FileUploadDialog } from "@/components/files/file-upload-dialog";
import { FileItemActions } from "@/components/files/file-item-actions";
import { GanttChart } from "@/components/orders/gantt-chart";
import { OrderDeleteButton } from "@/components/orders/order-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Edit,
  Clock,
  Calendar,
  DollarSign,
  User,
  Building2,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  Paperclip,
  ListTodo,
  Milestone,
  AlertCircle,
  GanttChartSquare,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import { OrderCommentForm } from "@/components/orders/order-comments";
import { MilestoneCard } from "@/components/milestones/milestone-card";
import { CreateMilestoneDialog } from "@/components/milestones/create-milestone-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

interface OrderPageProps {
  params: { id: string };
}

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "destructive" }> = {
  LOW: { label: "Низкий", variant: "secondary" },
  MEDIUM: { label: "Средний", variant: "default" },
  HIGH: { label: "Высокий", variant: "warning" },
  URGENT: { label: "Срочный", variant: "destructive" },
};

const taskStatusIcons: Record<string, React.ReactNode> = {
  TODO: <Circle className="w-4 h-4 text-muted-foreground" />,
  IN_PROGRESS: <Clock className="w-4 h-4 text-blue-500" />,
  REVIEW: <AlertCircle className="w-4 h-4 text-amber-500" />,
  DONE: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

export default async function OrderPage({ params }: OrderPageProps) {
  const [order, statuses, users, session] = await Promise.all([
    getOrder(params.id),
    getOrderStatuses(),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER", "DEVELOPER"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }).then((users) => users.map((u) => ({ id: u.id, name: u.name || "Без имени" }))),
    auth(),
  ]);
  const userRole = session?.user?.role || "";

  if (!order) {
    notFound();
  }

  // Calculate progress
  const allTasks = [
    ...(order.tasks || []),
    ...(order.milestones?.flatMap((m: any) => m.tasks || []) || []),
  ];
  const completedTasks = allTasks.filter((t: any) => t.status === "DONE").length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total time
  const totalHours = order.timeEntries?.reduce(
    (sum: number, te: any) => sum + (te.hours || 0),
    0
  ) || 0;

  const priority = priorityConfig[order.priority] || priorityConfig.MEDIUM;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-muted-foreground">
                {order.number}
              </span>
              <h1 className="text-2xl font-bold">{order.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {order.status && (
                <Badge
                  style={{
                    backgroundColor: order.status.color + "20",
                    color: order.status.color,
                    borderColor: order.status.color,
                  }}
                  variant="outline"
                >
                  {order.status.name}
                </Badge>
              )}
              <Badge variant={priority.variant}>{priority.label}</Badge>
              {order.client && (
                <Link href={`/clients/${order.client.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <Building2 className="w-3 h-3 mr-1" />
                    {order.client.name}
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/orders/${params.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          </Link>
          {userRole === "ADMIN" && (
            <OrderDeleteButton orderId={params.id} orderNumber={order.number} />
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ListTodo className="w-4 h-4" />
              Прогресс
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progressPercent} className="flex-1" />
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasks}/{totalTasks} задач
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              Время
            </div>
            <p className="text-lg font-bold">{totalHours}ч</p>
            {order.estimatedHours && (
              <p className="text-xs text-muted-foreground">
                из {Number(order.estimatedHours)}ч оценки
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              Бюджет
            </div>
            <p className="text-lg font-bold">
              {order.estimatedBudget
                ? formatCurrency(Number(order.estimatedBudget), order.currency)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              Дедлайн
            </div>
            <p className="text-lg font-bold">
              {order.deadline ? formatDate(order.deadline) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <User className="w-4 h-4" />
              Менеджер
            </div>
            <p className="text-sm font-medium">
              {order.manager?.name || "Не назначен"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {order.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Gantt Chart */}
          {allTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GanttChartSquare className="w-4 h-4" />
                  Диаграмма Ганта
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GanttChart
                  tasks={[
                    // Milestones as items
                    ...(order.milestones?.map((m: any) => ({
                      id: `m-${m.id}`,
                      title: m.title,
                      status: m.status,
                      startDate: m.startDate,
                      dueDate: m.dueDate,
                      isMilestone: true,
                    })) || []),
                    // Tasks from milestones
                    ...(order.milestones?.flatMap((m: any) =>
                      (m.tasks || []).map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        startDate: t.startDate,
                        dueDate: t.dueDate,
                        assignee: t.assignee?.name,
                        milestoneTitle: m.title,
                      }))
                    ) || []),
                    // Standalone tasks
                    ...(order.tasks?.map((t: any) => ({
                      id: t.id,
                      title: t.title,
                      status: t.status,
                      startDate: t.startDate,
                      dueDate: t.dueDate,
                      assignee: t.assignee?.name,
                    })) || []),
                  ]}
                  orderDeadline={order.deadline}
                />
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Milestone className="w-4 h-4" />
                Этапы
                {order.milestones && order.milestones.length > 0 && (
                  <Badge variant="secondary">{order.milestones.length}</Badge>
                )}
              </CardTitle>
              <CreateMilestoneDialog orderId={order.id} />
            </CardHeader>
            <CardContent className="space-y-4">
              {order.milestones && order.milestones.length > 0 ? (
                order.milestones.map((milestone: any, idx: number) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    orderId={order.id}
                    index={idx}
                    users={users}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Этапов нет. Создайте первый этап для структурирования работы.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tasks without milestone */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Задачи
                {order.tasks && order.tasks.length > 0 && (
                  <Badge variant="secondary">{order.tasks.length}</Badge>
                )}
              </CardTitle>
              <CreateTaskDialog
                orders={[{ id: order.id, title: order.title, number: order.number }]}
                users={users}
                milestones={order.milestones?.map((m: any) => ({ id: m.id, title: m.title })) || []}
                defaultOrderId={order.id}
              >
                <Button variant="outline" size="sm">
                  Добавить задачу
                </Button>
              </CreateTaskDialog>
            </CardHeader>
            <CardContent>
              {order.tasks && order.tasks.length > 0 ? (
                <div className="space-y-2">
                  {order.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {taskStatusIcons[task.status] || taskStatusIcons.TODO}
                        <div>
                          <p
                            className={
                              task.status === "DONE"
                                ? "line-through text-muted-foreground"
                                : "font-medium"
                            }
                          >
                            {task.title}
                          </p>
                          {task.assignee && (
                            <p className="text-xs text-muted-foreground">
                              {task.assignee.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            priorityConfig[task.priority]?.variant || "secondary"
                          }
                          className="text-xs"
                        >
                          {priorityConfig[task.priority]?.label || task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Задач без привязки к этапу нет.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Time Entries */}
          {order.timeEntries && order.timeEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Учёт времени
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Дата</th>
                        <th className="text-left py-2 font-medium">Сотрудник</th>
                        <th className="text-left py-2 font-medium">Описание</th>
                        <th className="text-right py-2 font-medium">Часы</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.timeEntries.map((entry: any) => (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-2">{formatDate(entry.date)}</td>
                          <td className="py-2">{entry.user?.name}</td>
                          <td className="py-2 text-muted-foreground">
                            {entry.description || "—"}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {entry.hours}ч
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Изменить статус</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusSelect
                orderId={order.id}
                currentStatusId={order.statusId}
                statuses={statuses}
              />
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Файлы
                <Badge variant="secondary">{order._count?.files || 0}</Badge>
              </CardTitle>
              <FileUploadDialog orderId={order.id} />
            </CardHeader>
            <CardContent>
              {order.files && order.files.length > 0 ? (
                <div className="space-y-2">
                  {order.files.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate group-hover:text-primary">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(file.createdAt)}
                            {file.isClientVisible && (
                              <span className="ml-2 text-green-600">Видно клиенту</span>
                            )}
                            {file.isClientDownloadable && (
                              <span className="ml-2 text-blue-600">Скачивание</span>
                            )}
                          </p>
                        </div>
                      </a>
                      <FileItemActions fileId={file.id} isClientVisible={file.isClientVisible} isClientDownloadable={file.isClientDownloadable} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Файлы не загружены
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Комментарии
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {order._count?.comments || 0}
              </span>
            </CardHeader>
            <CardContent>
              {order.comments && order.comments.length > 0 ? (
                <div className="space-y-3">
                  {order.comments.map((comment: any) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {comment.user?.name || comment.clientName || "Клиент"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Комментариев нет
                </p>
              )}
              <OrderCommentForm orderId={order.id} />
            </CardContent>
          </Card>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">История статусов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.statusHistory.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground">
                          {formatRelativeTime(entry.createdAt)}
                        </p>
                        {entry.comment && (
                          <p className="mt-0.5">{entry.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices */}
          {order.invoices && order.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Счета
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div>
                        <p className="text-sm font-mono">{invoice.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.issueDate)}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(invoice.total), invoice.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
