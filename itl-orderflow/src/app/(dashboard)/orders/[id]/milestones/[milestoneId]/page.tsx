import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle2,
  FileText,
  Calendar,
  DollarSign,
  User,
  ArrowLeft,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { approveMilestone, requestMilestoneChanges } from "@/actions/orders";

interface MilestoneApprovalPageProps {
  params: { id: string; milestoneId: string };
}

export default async function MilestoneApprovalPage({
  params,
}: MilestoneApprovalPageProps) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: params.milestoneId },
    include: {
      order: {
        include: {
          client: true,
          files: true,
        },
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!milestone) {
    notFound();
  }

  const order = milestone.order;

  // Find an assignee from tasks for the sidebar
  const primaryAssignee = milestone.tasks.find((t) => t.assignee)?.assignee;

  // Deliverables: use tasks if available, otherwise show generic items
  const deliverables =
    milestone.tasks.length > 0
      ? milestone.tasks.map((t) => ({
          id: t.id,
          label: t.title,
          done: t.status === "DONE",
        }))
      : [
          { id: "d1", label: "Основные результаты работы", done: false },
          { id: "d2", label: "Документация", done: false },
          { id: "d3", label: "Финальная проверка", done: false },
        ];

  // Files from the order
  const files = order.files || [];

  const milestoneStatusLabels: Record<string, string> = {
    PENDING: "ОЖИДАЕТ",
    IN_PROGRESS: "В РАБОТЕ",
    COMPLETED: "ОЖИДАЕТ ОДОБРЕНИЯ",
    APPROVED: "ОДОБРЕН",
    CANCELLED: "ОТМЕНЁН",
  };

  const statusLabel = milestoneStatusLabels[milestone.status] || milestone.status;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground transition-colors">
          Заказы
        </Link>
        <span>/</span>
        <Link
          href={`/orders/${order.id}`}
          className="hover:text-foreground transition-colors"
        >
          {order.number}
        </Link>
        <span>/</span>
        <span>Этапы</span>
        <span>/</span>
        <span className="text-foreground font-medium">{milestone.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/orders/${order.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="success">{statusLabel}</Badge>
          </div>
          <h1 className="text-2xl font-bold">
            Одобрение этапа: {milestone.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Просмотрите результаты работы и примите решение
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Результаты работы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliverables.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        item.done
                          ? "text-green-500"
                          : "text-muted-foreground/40"
                      }`}
                    />
                    <span
                      className={
                        item.done
                          ? "text-muted-foreground line-through"
                          : "font-medium"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Файлы для проверки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {files.map((file: any) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <FileText className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-center truncate w-full group-hover:text-primary">
                        {file.originalName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(file.createdAt)}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {milestone.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Описание этапа</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {milestone.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Milestone Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Детали этапа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dates */}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Даты</p>
                  <p className="text-sm text-muted-foreground">
                    {milestone.startDate
                      ? formatDate(milestone.startDate)
                      : "—"}{" "}
                    —{" "}
                    {milestone.dueDate
                      ? formatDate(milestone.dueDate)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Стоимость</p>
                  <p className="text-sm text-muted-foreground">
                    {milestone.estimatedHours
                      ? `${Number(milestone.estimatedHours)} ч`
                      : order.estimatedBudget
                        ? formatCurrency(
                            Number(order.estimatedBudget),
                            order.currency
                          )
                        : "—"}
                  </p>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ответственный</p>
                  {primaryAssignee ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(primaryAssignee.name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {primaryAssignee.name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Не назначен
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action={async () => {
                "use server";
                await approveMilestone(milestone.id);
              }}>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Утвердить этап
                </Button>
              </form>
              <form action={async () => {
                "use server";
                await requestMilestoneChanges(milestone.id, "");
              }}>
                <Button type="submit" variant="outline" className="w-full">
                  Запросить доработку
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
