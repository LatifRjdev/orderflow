import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalOrder } from "@/actions/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  Paperclip,
  AlertCircle,
  CheckCheck,
  ThumbsUp,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { PortalCommentForm } from "@/components/portal/portal-comments";
import { MilestoneApproveButton } from "@/components/portal/milestone-approve-button";

interface PortalOrderPageProps {
  params: { id: string };
}

const taskStatusIcons: Record<string, { icon: any; color: string }> = {
  TODO: { icon: Circle, color: "text-gray-400" },
  IN_PROGRESS: { icon: Clock, color: "text-blue-500" },
  REVIEW: { icon: AlertCircle, color: "text-amber-500" },
  DONE: { icon: CheckCircle2, color: "text-green-500" },
};

const milestoneStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  PENDING: { label: "Ожидает", variant: "secondary" },
  IN_PROGRESS: { label: "В работе", variant: "default" },
  COMPLETED: { label: "Завершён", variant: "warning" },
  APPROVED: { label: "Согласован", variant: "success" },
};

export default async function PortalOrderPage({ params }: PortalOrderPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const order = await getPortalOrder(client.id, params.id);
  if (!order) notFound();

  // Calculate stats - include both direct tasks and milestone tasks
  const allTasks = [
    ...(order.tasks || []),
    ...(order.milestones?.flatMap((m: any) => m.tasks || []) || []),
  ];
  const doneTasks = allTasks.filter((t: any) => t.status === "DONE").length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalInvoiced = order.invoices?.reduce(
    (sum: number, inv: any) => sum + Number(inv.total),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/portal">
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
            {order.deadline && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Дедлайн: {formatDate(order.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Прогресс</p>
              <div className="flex items-center gap-3">
                <Progress value={progressPercent} className="flex-1 h-3" />
                <span className="text-lg font-bold">{progressPercent}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {doneTasks} из {totalTasks} задач выполнено
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Этапов</p>
              <p className="text-2xl font-bold">{order.milestones?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Счетов на сумму</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {order.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">О проекте</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Milestones & Tasks */}
        <div className="col-span-2 space-y-6">
          <h2 className="text-lg font-bold">Этапы проекта</h2>

          {order.milestones && order.milestones.length > 0 ? (
            order.milestones.map((milestone: any, idx: number) => {
              const mTasks = milestone.tasks || [];
              const mDone = mTasks.filter((t: any) => t.status === "DONE").length;
              const mProgress = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;
              const msStatus = milestoneStatusConfig[milestone.status] || milestoneStatusConfig.PENDING;
              const canApprove = milestone.status === "COMPLETED";

              return (
                <Card key={milestone.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Этап {idx + 1}
                          </span>
                          <Badge variant={msStatus.variant}>
                            {msStatus.label}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-lg mt-1">
                          {milestone.title}
                        </h3>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      {canApprove && (
                        <MilestoneApproveButton
                          clientId={client.id}
                          milestoneId={milestone.id}
                        />
                      )}
                      {milestone.status === "APPROVED" && (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm">
                          <CheckCheck className="w-4 h-4" />
                          Согласован
                          {milestone.clientApprovedAt && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {formatDate(milestone.clientApprovedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3 mb-4">
                      <Progress value={mProgress} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">
                        {mDone}/{mTasks.length}
                      </span>
                    </div>

                    {/* Tasks */}
                    {mTasks.length > 0 && (
                      <div className="space-y-1.5">
                        {mTasks.map((task: any) => {
                          const st = taskStatusIcons[task.status] || taskStatusIcons.TODO;
                          const Icon = st.icon;
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                            >
                              <Icon className={`w-4 h-4 ${st.color}`} />
                              <span
                                className={
                                  task.status === "DONE"
                                    ? "text-sm line-through text-muted-foreground"
                                    : "text-sm"
                                }
                              >
                                {task.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Milestone Files */}
                    {milestone.files && milestone.files.length > 0 && (
                      <div className="mt-4 pt-3 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          Файлы этапа
                        </p>
                        {milestone.files.map((file: any) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                          >
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 flex-1 min-w-0"
                            >
                              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate flex-1 hover:text-primary">{file.originalName}</span>
                            </a>
                            {file.isClientDownloadable && (
                              <a
                                href={file.url}
                                download={file.originalName}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                                title="Скачать"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : order.tasks && order.tasks.length > 0 ? (
            /* Show direct tasks when no milestones */
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Задачи проекта</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {order.tasks.map((task: any) => {
                    const st = taskStatusIcons[task.status] || taskStatusIcons.TODO;
                    const Icon = st.icon;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Icon className={`w-4 h-4 ${st.color}`} />
                        <span
                          className={
                            task.status === "DONE"
                              ? "text-sm line-through text-muted-foreground"
                              : "text-sm"
                          }
                        >
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Этапы проекта пока не добавлены
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Файлы
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.files && order.files.length > 0 ? (
                <div className="space-y-2">
                  {order.files.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate hover:text-primary">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </a>
                      {file.isClientDownloadable && (
                        <a
                          href={file.url}
                          download={file.originalName}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                          title="Скачать"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Файлов нет
                </p>
              )}
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
              {order.comments && order.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {order.comments.map((comment: any) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {comment.user?.name || "Клиент"}
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
                <p className="text-sm text-muted-foreground text-center py-2 mb-4">
                  Комментариев нет
                </p>
              )}

              {/* Add comment */}
              <PortalCommentForm
                clientId={client.id}
                clientName={client.name}
                orderId={order.id}
              />
            </CardContent>
          </Card>

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
                  {order.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="text-sm font-mono">{inv.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(inv.total), inv.currency)}
                        </p>
                        <Badge
                          variant={
                            inv.status === "PAID"
                              ? "success"
                              : inv.status === "OVERDUE"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {inv.status === "PAID" ? "Оплачен" : inv.status === "OVERDUE" ? "Просрочен" : "Ожидает"}
                        </Badge>
                      </div>
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
