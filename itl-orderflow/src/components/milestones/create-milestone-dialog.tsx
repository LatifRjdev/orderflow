"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Milestone as MilestoneIcon, Calendar } from "lucide-react";
import { createMilestone, updateMilestone } from "@/actions/milestones";

interface MilestoneData {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  estimatedHours?: number | null;
  requiresApproval?: boolean;
}

interface CreateMilestoneDialogProps {
  orderId: string;
  milestone?: MilestoneData;
  children?: React.ReactNode;
}

export function CreateMilestoneDialog({
  orderId,
  milestone,
  children,
}: CreateMilestoneDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(
    milestone?.requiresApproval ?? false
  );

  const isEdit = !!milestone;

  function formatDateForInput(date: string | Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      startDate: (form.get("startDate") as string) || undefined,
      dueDate: (form.get("dueDate") as string) || undefined,
      estimatedHours: form.get("estimatedHours")
        ? parseFloat(form.get("estimatedHours") as string)
        : undefined,
      requiresApproval,
    };

    try {
      const result = isEdit
        ? await updateMilestone(milestone!.id, data)
        : await createMilestone({ ...data, orderId });

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Добавить этап
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MilestoneIcon className="w-5 h-5" />
            {isEdit ? "Редактировать этап" : "Новый этап"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените параметры этапа проекта."
              : "Создайте новый этап для структурирования работы."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Например: Дизайн макетов"
              defaultValue={milestone?.title || ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Описание этапа..."
              rows={3}
              defaultValue={milestone?.description || ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Начало</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="pl-9"
                  defaultValue={formatDateForInput(milestone?.startDate)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Дедлайн</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className="pl-9"
                  defaultValue={formatDateForInput(milestone?.dueDate)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Оценка (часы)</Label>
            <Input
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              placeholder="40"
              defaultValue={
                milestone?.estimatedHours
                  ? String(milestone.estimatedHours)
                  : ""
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresApproval"
              checked={requiresApproval}
              onCheckedChange={(checked) =>
                setRequiresApproval(checked === true)
              }
            />
            <Label htmlFor="requiresApproval" className="text-sm font-normal">
              Требует согласования клиентом
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Сохранение..."
                  : "Создание..."
                : isEdit
                  ? "Сохранить"
                  : "Создать этап"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
