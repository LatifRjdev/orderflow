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
import { GenerateActDialog } from "@/components/orders/generate-act-dialog";

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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: order.status.color + "40", backgroundColor: order.status.color + "10" }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: order.status.color }} />
                  <span className="text-sm font-medium" style={{ color: order.status.color }}>{order.status.name}</span>
                </div>
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
          <GenerateActDialog
            orderId={params.id}
            orderNumber={order.number}
            currency={order.currency || "TJS"}
            tasks={order.tasks?.map((t: any) => ({ title: t.title })) || []}
            milestones={order.milestones?.map((m: any) => ({ title: m.title, amount: Number(m.amount || 0) })) || []}
          />
          {userRole === "ADMIN" && (
            <OrderDeleteButton orderId={params.id} orderNumber={order.number} />
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#dbdfe6] shadow-sm">
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
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#dbdfe6] shadow-sm">
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
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            Бюджет
          </div>
          <p className="text-lg font-bold">
            {order.estimatedBudget
              ? formatCurrency(Number(order.estimatedBudget), order.currency)
              : "—"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            Дедлайн
          </div>
          <p className="text-lg font-bold">
            {order.deadline ? formatDate(order.deadline) : "—"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <User className="w-4 h-4" />
            Менеджер
          </div>
          <p className="text-sm font-medium">
            {order.manager?.name || "Не назначен"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {order.description && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-base font-semibold">Описание</h3>
              </div>
              <div className="px-6 pb-6">
                <p className="text-sm whitespace-pre-wrap">{order.description}</p>
              </div>
            </div>
          )}

          {/* Gantt Chart */}
          {allTasks.length > 0 && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <GanttChartSquare className="w-4 h-4" />
                  Диаграмма Ганта
                </h3>
              </div>
              <div className="px-6 pb-6">
                <GanttChart
                  tasks={[
                    ...(order.milestones?.map((m: any) => ({
                      id: `m-${m.id}`,
                      title: m.title,
                      status: m.status,
                      startDate: m.startDate,
                      dueDate: m.dueDate,
                      isMilestone: true,
                    })) || []),
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
              </div>
            </div>
          )}

          {/* Milestones */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Milestone className="w-4 h-4" />
                Этапы
                {order.milestones && order.milestones.length > 0 && (
                  <Badge variant="secondary">{order.milestones.length}</Badge>
                )}
              </h3>
              <CreateMilestoneDialog orderId={order.id} />
            </div>
            <div className="px-6 pb-6 space-y-4">
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
            </div>
          </div>

          {/* Tasks without milestone */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Задачи
                {order.tasks && order.tasks.length > 0 && (
                  <Badge variant="secondary">{order.tasks.length}</Badge>
                )}
              </h3>
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
            </div>
            <div className="px-6 pb-6">
              {order.tasks && order.tasks.length > 0 ? (
                <div className="space-y-2">
                  {order.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50 transition-colors"
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
            </div>
          </div>

          {/* Time Entries */}
          {order.timeEntries && order.timeEntries.length > 0 && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Учёт времени
                </h3>
              </div>
              <div className="px-6 pb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#dbdfe6]">
                        <th className="text-left py-2 font-medium">Дата</th>
                        <th className="text-left py-2 font-medium">Сотрудник</th>
                        <th className="text-left py-2 font-medium">Описание</th>
                        <th className="text-right py-2 font-medium">Часы</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.timeEntries.map((entry: any) => (
                        <tr key={entry.id} className="border-b border-[#dbdfe6] last:border-0">
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
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Change */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Изменить статус</h3>
            </div>
            <div className="px-6 pb-6">
              <OrderStatusSelect
                orderId={order.id}
                currentStatusId={order.statusId}
                statuses={statuses}
              />
            </div>
          </div>

          {/* Files */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Файлы
                <Badge variant="secondary">{order._count?.files || 0}</Badge>
              </h3>
              <FileUploadDialog orderId={order.id} />
            </div>
            <div className="px-6 pb-6">
              {order.files && order.files.length > 0 ? (
                <div className="space-y-2">
                  {order.files.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-light/50 group transition-colors"
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
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Комментарии
              </h3>
              <span className="text-sm text-muted-foreground">
                {order._count?.comments || 0}
              </span>
            </div>
            <div className="px-6 pb-6">
              {order.comments && order.comments.length > 0 ? (
                <div className="space-y-3">
                  {order.comments.map((comment: any) => (
                    <div key={comment.id} className="border border-[#dbdfe6] rounded-lg p-3">
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
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-base font-semibold">История статусов</h3>
              </div>
              <div className="px-6 pb-6">
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
              </div>
            </div>
          )}

          {/* Documents */}
          {((order as any).contracts?.length > 0 || (order as any).techSpecs?.length > 0) && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Документы
                  </h3>
                  <Link href={`/documents/contracts/new`}>
                    <Button variant="ghost" size="sm" className="text-xs">Создать</Button>
                  </Link>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-2">
                {(order as any).contracts?.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/documents/contracts/${c.id}`}
                    className="flex items-center justify-between p-2 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Договор</p>
                      <p className="text-sm font-mono">{c.number}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.title}</span>
                  </Link>
                ))}
                {(order as any).techSpecs?.map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/documents/specs/${s.id}`}
                    className="flex items-center justify-between p-2 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">ТЗ v{s.version}</p>
                      <p className="text-sm font-mono">{s.number}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {order.invoices && order.invoices.length > 0 && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Счета
                </h3>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {order.invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-[#dbdfe6]"
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
