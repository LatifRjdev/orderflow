"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Calendar, Loader2 } from "lucide-react";
import { updateTask } from "@/actions/tasks";
import { toast } from "@/lib/use-toast";

interface TaskEditDialogProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    estimatedHours?: number | null;
    dueDate?: Date | string | null;
    assigneeId?: string | null;
    milestoneId?: string | null;
  };
  users: { id: string; name: string }[];
  milestones?: { id: string; title: string }[];
}

export function TaskEditDialog({ task, users, milestones }: TaskEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateTask(task.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Задача обновлена");
        setOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  const dueDate = task.dueDate
    ? new Date(task.dueDate).toISOString().split("T")[0]
    : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Редактировать
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Название *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={task.title}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-assigneeId">Исполнитель</Label>
              <Select name="assigneeId" defaultValue={task.assigneeId || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Назначить" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Приоритет</Label>
              <Select name="priority" defaultValue={task.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                  <SelectItem value="URGENT">Срочный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-estimatedHours">Часы (оценка)</Label>
              <Input
                id="edit-estimatedHours"
                name="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                defaultValue={task.estimatedHours ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Дедлайн</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-deadline"
                  name="deadline"
                  type="date"
                  className="pl-9"
                  defaultValue={dueDate}
                />
              </div>
            </div>

            {milestones && milestones.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-milestoneId">Этап</Label>
                <Select name="milestoneId" defaultValue={task.milestoneId || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Без этапа" />
                  </SelectTrigger>
                  <SelectContent>
                    {milestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={task.description || ""}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
