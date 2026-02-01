"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Square, Trash2, Plus, Loader2 } from "lucide-react";
import { toggleChecklistItem, createChecklistItem, deleteChecklistItem } from "@/actions/tasks";
import { toast } from "@/lib/use-toast";

interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface TaskChecklistProps {
  taskId: string;
  items: ChecklistItem[];
}

export function TaskChecklist({ taskId, items }: TaskChecklistProps) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const total = items.length;
  const done = items.filter((i) => i.isCompleted).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleToggle(id: string) {
    setToggleLoading(id);
    try {
      const result = await toggleChecklistItem(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setToggleLoading(null);
    }
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setAddLoading(true);
    try {
      const result = await createChecklistItem(taskId, newTitle.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        setNewTitle("");
        setShowInput(false);
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(id);
    try {
      const result = await deleteChecklistItem(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setDeleteLoading(null);
    }
  }

  return (
    <div>
      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {done}/{total}
          </span>
        </div>
      )}

      {/* Items */}
      {items.length > 0 ? (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 group"
            >
              <button
                onClick={() => handleToggle(item.id)}
                disabled={toggleLoading === item.id}
                className="flex-shrink-0"
              >
                {toggleLoading === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : item.isCompleted ? (
                  <CheckSquare className="w-4 h-4 text-green-500" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <span
                className={
                  item.isCompleted
                    ? "line-through text-muted-foreground flex-1"
                    : "flex-1"
                }
              >
                {item.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                disabled={deleteLoading === item.id}
                onClick={() => handleDelete(item.id)}
              >
                {deleteLoading === item.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        !showInput && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет элементов
          </p>
        )
      )}

      {/* Add new item */}
      {showInput ? (
        <div className="flex items-center gap-2 mt-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Новый пункт..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setShowInput(false);
                setNewTitle("");
              }
            }}
          />
          <Button size="sm" onClick={handleAdd} disabled={addLoading || !newTitle.trim()}>
            {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Добавить"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowInput(false);
              setNewTitle("");
            }}
          >
            Отмена
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 gap-1.5"
          onClick={() => setShowInput(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить
        </Button>
      )}
    </div>
  );
}
