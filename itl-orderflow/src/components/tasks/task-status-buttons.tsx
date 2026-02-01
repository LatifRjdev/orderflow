"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Circle, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { updateTaskStatus } from "@/actions/tasks";
import { toast } from "@/lib/use-toast";

const statusConfig: Record<string, { label: string; icon: any }> = {
  TODO: { label: "К выполнению", icon: Circle },
  IN_PROGRESS: { label: "В работе", icon: Clock },
  REVIEW: { label: "На проверке", icon: AlertCircle },
  DONE: { label: "Готово", icon: CheckCircle2 },
};

interface TaskStatusButtonsProps {
  taskId: string;
  currentStatus: string;
}

export function TaskStatusButtons({ taskId, currentStatus }: TaskStatusButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatusChange(status: string) {
    if (status === currentStatus) return;
    setLoading(status);
    try {
      const result = await updateTaskStatus(taskId, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Статус:</span>
      {Object.entries(statusConfig).map(([key, cfg]) => {
        const Icon = cfg.icon;
        const isActive = currentStatus === key;
        const isLoading = loading === key;
        return (
          <Button
            key={key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            disabled={loading !== null}
            onClick={() => handleStatusChange(key)}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {cfg.label}
          </Button>
        );
      })}
    </div>
  );
}
