"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Flag, Calendar, User, Plus } from "lucide-react";
import { createTask } from "@/actions/tasks";

interface Order {
  id: string;
  title: string;
  number: string;
  milestones?: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
}

interface QuickTaskDialogProps {
  orders: Order[];
  userId: string;
  children: React.ReactNode;
}

export function QuickTaskDialog({
  orders,
  userId,
  children,
}: QuickTaskDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [deadline, setDeadline] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const milestones = selectedOrder?.milestones ?? [];

  const resetForm = useCallback(() => {
    setPriority("MEDIUM");
    setDeadline("");
    setSelectedOrderId("");
    setError(null);
    formRef.current?.reset();
  }, []);

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      resetForm();
    }
  }

  function getToday(): string {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }

  function getTomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Ensure hidden fields are set
    formData.set("priority", priority);
    formData.set("assigneeId", userId);
    if (deadline) {
      formData.set("deadline", deadline);
    }

    try {
      const result = await createTask(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        resetForm();
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.target as HTMLElement;
      // Only submit on Enter from the title input
      if (target.tagName === "INPUT" && (target as HTMLInputElement).name === "title") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
  }

  const priorityOptions = [
    { value: "LOW", label: "Низкий", color: "text-muted-foreground border-input bg-background" },
    { value: "MEDIUM", label: "Средний", color: "text-yellow-700 border-yellow-300 bg-yellow-50" },
    { value: "HIGH", label: "Высокий", color: "text-red-700 border-red-300 bg-red-50" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4 text-primary" />
            Быстрое создание задачи
          </DialogTitle>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="flex flex-col"
        >
          {error && (
            <div className="mx-5 mb-3 p-2.5 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Task title input */}
          <div className="px-5 pb-4">
            <Input
              name="title"
              placeholder="Что нужно сделать?"
              required
              autoFocus
              className="h-11 text-base border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Fields grid */}
          <div className="px-5 pb-4 space-y-3">
            {/* Project selector */}
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-1.5 w-24 text-muted-foreground text-xs shrink-0">
                <Target className="w-3.5 h-3.5" />
                Проект
              </Label>
              <Select
                name="orderId"
                required
                value={selectedOrderId}
                onValueChange={setSelectedOrderId}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Выберите заказ" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.number} — {order.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Milestone selector */}
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-1.5 w-24 text-muted-foreground text-xs shrink-0">
                <Flag className="w-3.5 h-3.5" />
                Этап
              </Label>
              <Select name="milestoneId">
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Без этапа" />
                </SelectTrigger>
                <SelectContent>
                  {milestones.length > 0 ? (
                    milestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none" disabled>
                      Нет этапов
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Priority inline selector */}
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-1.5 w-24 text-muted-foreground text-xs shrink-0">
                <Flag className="w-3.5 h-3.5" />
                Приоритет
              </Label>
              <div className="flex gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      priority === opt.value
                        ? opt.color
                        : "text-muted-foreground border-transparent bg-transparent hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-1.5 w-24 text-muted-foreground text-xs shrink-0">
                <User className="w-3.5 h-3.5" />
                Исполнитель
              </Label>
              <div className="flex items-center gap-2 h-8 px-2 text-sm text-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                  Я
                </div>
                <span className="text-sm">Я</span>
              </div>
            </div>

            {/* Deadline quick-select */}
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-1.5 w-24 text-muted-foreground text-xs shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                Срок
              </Label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDeadline(getToday())}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    deadline === getToday()
                      ? "text-blue-700 border-blue-300 bg-blue-50"
                      : "text-muted-foreground border-input bg-background hover:bg-accent"
                  }`}
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  onClick={() => setDeadline(getTomorrow())}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    deadline === getTomorrow()
                      ? "text-blue-700 border-blue-300 bg-blue-50"
                      : "text-muted-foreground border-input bg-background hover:bg-accent"
                  }`}
                >
                  Завтра
                </button>
                <div className="relative">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className={`flex items-center justify-center w-8 h-7 rounded-md border transition-colors cursor-pointer ${
                      deadline && deadline !== getToday() && deadline !== getTomorrow()
                        ? "text-blue-700 border-blue-300 bg-blue-50"
                        : "text-muted-foreground border-input bg-background hover:bg-accent"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                {deadline && deadline !== getToday() && deadline !== getTomorrow() && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {new Date(deadline + "T00:00:00").toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Hidden fields */}
          <input type="hidden" name="priority" value={priority} />
          <input type="hidden" name="assigneeId" value={userId} />
          {deadline && <input type="hidden" name="deadline" value={deadline} />}

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
            <span className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
              {" "}для сохранения
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Отмена
              </button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? "Создание..." : "Создать задачу"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
