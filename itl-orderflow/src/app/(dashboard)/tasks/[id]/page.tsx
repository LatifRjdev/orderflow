import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTask } from "@/actions/tasks";
import { TaskDeleteButton } from "@/components/tasks/task-delete-button";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Briefcase,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { TaskStatusButtons } from "@/components/tasks/task-status-buttons";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";

interface TaskPageProps {
  params: { id: string };
}

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "destructive" }> = {
  LOW: { label: "Низкий", variant: "secondary" },
  MEDIUM: { label: "Средний", variant: "default" },
  HIGH: { label: "Высокий", variant: "warning" },
  URGENT: { label: "Срочный", variant: "destructive" },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  TODO: { label: "К выполнению", color: "text-gray-500", icon: Circle },
  IN_PROGRESS: { label: "В работе", color: "text-blue-500", icon: Clock },
  REVIEW: { label: "На проверке", color: "text-amber-500", icon: AlertCircle },
  DONE: { label: "Готово", color: "text-green-500", icon: CheckCircle2 },
};

export default async function TaskPage({ params }: TaskPageProps) {
  const task = await getTask(params.id);

  if (!task) {
    notFound();
  }

  const session = await auth();
  const userRole = session?.user?.role || "";

  // Fetch users and milestones for edit dialog
  const [users, milestones] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    task.orderId
      ? prisma.milestone.findMany({
          where: { orderId: task.orderId },
          select: { id: true, title: true },
          orderBy: { position: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const status = statusConfig[task.status] || statusConfig.TODO;
  const StatusIcon = status.icon;

  const totalHours = task.timeEntries?.reduce(
    (sum: number, te: any) => sum + Number(te.hours || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                <span className="text-sm font-medium">{status.label}</span>
              </div>
              <Badge variant={priority.variant}>{priority.label}</Badge>
              {task.order && (
                <Link href={`/orders/${task.order.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {task.order.number}
                  </Badge>
                </Link>
              )}
              {task.milestone && (
                <Badge variant="outline">
                  {task.milestone.title}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TaskEditDialog task={{...task, estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null}} users={users.map(u => ({ ...u, name: u.name || "" }))} milestones={milestones} />
          {userRole === "ADMIN" && (
            <TaskDeleteButton taskId={task.id} taskTitle={task.title} />
          )}
        </div>
      </div>

      {/* Status Buttons */}
      <Card>
        <CardContent className="p-4">
          <TaskStatusButtons taskId={task.id} currentStatus={task.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Чеклист
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskChecklist taskId={task.id} items={task.checklists || []} />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Комментарии
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map((comment: any) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {comment.user?.name}
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

              <TaskCommentForm taskId={task.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Исполнитель</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {task.assignee?.name || "Не назначен"}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Заказ</p>
                {task.order && (
                  <Link
                    href={`/orders/${task.order.id}`}
                    className="text-sm text-primary hover:underline mt-1 block"
                  >
                    {task.order.number} — {task.order.title}
                  </Link>
                )}
              </div>

              {task.milestone && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Этап</p>
                    <p className="font-medium mt-1">{task.milestone.title}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Дедлайн</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{task.dueDate ? formatDate(task.dueDate) : "Не задан"}</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Оценка</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {task.estimatedHours ? `${task.estimatedHours}ч` : "Не задана"}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>Создана: {formatDate(task.createdAt)}</p>
                {task.completedAt && (
                  <p>Завершена: {formatDate(task.completedAt)}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Entries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Время
              </CardTitle>
              <Badge variant="secondary">{totalHours}ч</Badge>
            </CardHeader>
            <CardContent>
              {task.timeEntries && task.timeEntries.length > 0 ? (
                <div className="space-y-2">
                  {task.timeEntries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded border text-sm"
                    >
                      <div>
                        <p className="font-medium">{entry.user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                          {entry.description && ` — ${entry.description}`}
                        </p>
                      </div>
                      <span className="font-medium">{entry.hours}ч</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет записей
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
