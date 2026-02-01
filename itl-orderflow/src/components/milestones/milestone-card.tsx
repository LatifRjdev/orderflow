"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  CheckCheck,
  XCircle,
  Plus,
  Paperclip,
  FileText,
  Image,
  File as FileIcon,
  Download,
} from "lucide-react";
import { updateMilestoneStatus, deleteMilestone } from "@/actions/milestones";
import { updateTaskStatus } from "@/actions/tasks";
import { CreateMilestoneDialog } from "./create-milestone-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { FileUploadDialog } from "@/components/files/file-upload-dialog";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { id: string; name: string } | null;
  estimatedHours?: number | null;
}

interface MilestoneFile {
  id: string;
  originalName: string;
  url: string;
  mimeType?: string | null;
  size: number;
  createdAt: string | Date;
}

interface MilestoneData {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  estimatedHours?: number | null;
  requiresApproval: boolean;
  clientApprovedAt?: string | Date | null;
  tasks: Task[];
  files?: MilestoneFile[];
}

interface MilestoneCardProps {
  milestone: MilestoneData;
  orderId: string;
  index: number;
  users: { id: string; name: string }[];
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "warning" | "destructive" | "outline"; color: string }
> = {
  PENDING: { label: "Ожидает", variant: "secondary", color: "text-gray-500" },
  IN_PROGRESS: { label: "В работе", variant: "default", color: "text-blue-500" },
  COMPLETED: { label: "Завершён", variant: "warning", color: "text-amber-500" },
  APPROVED: { label: "Согласован", variant: "outline", color: "text-green-600" },
  CANCELLED: { label: "Отменён", variant: "destructive", color: "text-red-500" },
};

const taskStatusIcons: Record<string, React.ReactNode> = {
  TODO: <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5 text-blue-500" />,
  REVIEW: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  DONE: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

const taskStatusLabels: Record<string, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Выполнена",
  CANCELLED: "Отменена",
};

// Valid status transitions
function getNextStatuses(current: string): { status: string; label: string; icon: React.ReactNode }[] {
  switch (current) {
    case "PENDING":
      return [
        { status: "IN_PROGRESS", label: "Начать работу", icon: <PlayCircle className="w-4 h-4" /> },
        { status: "CANCELLED", label: "Отменить", icon: <XCircle className="w-4 h-4" /> },
      ];
    case "IN_PROGRESS":
      return [
        { status: "COMPLETED", label: "Завершить", icon: <CheckCheck className="w-4 h-4" /> },
        { status: "CANCELLED", label: "Отменить", icon: <XCircle className="w-4 h-4" /> },
      ];
    case "COMPLETED":
      return [
        { status: "APPROVED", label: "Согласовать", icon: <CheckCircle2 className="w-4 h-4" /> },
        { status: "IN_PROGRESS", label: "Вернуть в работу", icon: <PlayCircle className="w-4 h-4" /> },
      ];
    case "APPROVED":
      return [
        { status: "IN_PROGRESS", label: "Вернуть в работу", icon: <PlayCircle className="w-4 h-4" /> },
      ];
    case "CANCELLED":
      return [
        { status: "PENDING", label: "Восстановить", icon: <Circle className="w-4 h-4" /> },
      ];
    default:
      return [];
  }
}

export function MilestoneCard({ milestone, orderId, index, users }: MilestoneCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [taskStatusLoading, setTaskStatusLoading] = useState<string | null>(null);

  const mTasks = milestone.tasks || [];
  const mDone = mTasks.filter((t) => t.status === "DONE").length;
  const mProgress = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;

  const status = statusConfig[milestone.status] || statusConfig.PENDING;
  const nextStatuses = getNextStatuses(milestone.status);

  async function handleStatusChange(newStatus: string) {
    setStatusLoading(true);
    try {
      await updateMilestoneStatus(milestone.id, newStatus);
      router.refresh();
    } catch {
      // error handled by server action
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteMilestone(milestone.id);
      router.refresh();
    } catch {
      // error handled by server action
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  }

  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    setTaskStatusLoading(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      router.refresh();
    } catch {
      // error handled by server action
    } finally {
      setTaskStatusLoading(null);
    }
  }

  const taskNextStatus: Record<string, { status: string; label: string }[]> = {
    TODO: [
      { status: "IN_PROGRESS", label: "В работу" },
      { status: "CANCELLED", label: "Отменить" },
    ],
    IN_PROGRESS: [
      { status: "REVIEW", label: "На проверку" },
      { status: "DONE", label: "Выполнена" },
      { status: "TODO", label: "Назад" },
    ],
    REVIEW: [
      { status: "DONE", label: "Выполнена" },
      { status: "IN_PROGRESS", label: "В работу" },
    ],
    DONE: [
      { status: "IN_PROGRESS", label: "В работу" },
    ],
    CANCELLED: [
      { status: "TODO", label: "Восстановить" },
    ],
  };

  return (
    <>
      <div className="border rounded-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">
                Этап {index + 1}: {milestone.title}
              </h4>
              <Badge variant={status.variant}>{status.label}</Badge>
              {milestone.requiresApproval && (
                <Badge variant="outline" className="text-xs">
                  Согласование
                </Badge>
              )}
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground">
                {milestone.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Status transitions */}
            {nextStatuses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={statusLoading}
                    className="text-xs"
                  >
                    {statusLoading ? "..." : "Статус"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {nextStatuses.map((ns) => (
                    <DropdownMenuItem
                      key={ns.status}
                      onClick={() => handleStatusChange(ns.status)}
                    >
                      {ns.icon}
                      <span className="ml-2">{ns.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <CreateMilestoneDialog orderId={orderId} milestone={milestone as any}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="w-4 h-4 mr-2" />
                    Редактировать
                  </DropdownMenuItem>
                </CreateMilestoneDialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteAlert(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress */}
        {mTasks.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Progress value={mProgress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {mDone}/{mTasks.length} задач
            </span>
          </div>
        )}

        {/* Tasks */}
        {mTasks.length > 0 && (
          <div className="space-y-1 mb-3">
            {mTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 group"
              >
                <div className="flex items-center gap-2">
                  {/* Clickable status icon */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="hover:scale-110 transition-transform"
                        disabled={taskStatusLoading === task.id}
                      >
                        {taskStatusIcons[task.status] || taskStatusIcons.TODO}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(taskNextStatus[task.status] || []).map((ns) => (
                        <DropdownMenuItem
                          key={ns.status}
                          onClick={() => handleTaskStatusChange(task.id, ns.status)}
                        >
                          {taskStatusIcons[ns.status]}
                          <span className="ml-2">{ns.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span
                    className={
                      task.status === "DONE"
                        ? "line-through text-muted-foreground text-sm"
                        : "text-sm"
                    }
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {task.assignee && (
                    <span className="text-xs text-muted-foreground">
                      {task.assignee.name}
                    </span>
                  )}
                  {task.estimatedHours && (
                    <span className="text-xs text-muted-foreground">
                      {Number(task.estimatedHours)}ч
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Files */}
        {milestone.files && milestone.files.length > 0 && (
          <div className="space-y-1.5 mb-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              Файлы ({milestone.files.length})
            </p>
            {milestone.files.map((file) => {
              const isImage = file.mimeType?.startsWith("image/");
              const isPdf = file.mimeType === "application/pdf";
              const Icon = isImage ? Image : isPdf ? FileText : FileIcon;
              return (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{file.originalName}</span>
                  <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        {/* Add task & upload file buttons */}
        <div className="flex items-center gap-2">
        <CreateTaskDialog
          orders={[{ id: orderId, title: "", number: "" }]}
          users={users}
          milestones={[{ id: milestone.id, title: milestone.title }]}
          defaultOrderId={orderId}
          defaultMilestoneId={milestone.id}
        >
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Добавить задачу
          </Button>
        </CreateTaskDialog>
        <FileUploadDialog
          orderId={orderId}
          milestoneId={milestone.id}
          trigger={
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Paperclip className="w-3.5 h-3.5 mr-1" />
              Прикрепить файл
            </Button>
          }
        />
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить этап?</AlertDialogTitle>
            <AlertDialogDescription>
              Этап &laquo;{milestone.title}&raquo; будет удалён. Задачи этапа
              станут самостоятельными (без привязки к этапу).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
