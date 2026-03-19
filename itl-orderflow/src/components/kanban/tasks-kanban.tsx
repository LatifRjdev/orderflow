"use client";

import { useRouter } from "next/navigation";
import { KanbanBoard, type KanbanColumnData } from "./kanban-board";
import { updateTaskStatus } from "@/actions/tasks";

interface TasksKanbanProps {
  columns: KanbanColumnData[];
}

export function TasksKanban({ columns }: TasksKanbanProps) {
  const router = useRouter();

  async function handleMoveItem(itemId: string, toColumnId: string) {
    await updateTaskStatus(itemId, toColumnId);
    router.refresh();
  }

  return <KanbanBoard columns={columns} onMoveItem={handleMoveItem} />;
}
