"use client";

import { useRouter } from "next/navigation";
import { KanbanBoard, type KanbanColumnData } from "./kanban-board";
import { type KanbanCardData } from "./kanban-card";
import { updateOrderStatus } from "@/actions/orders";

interface OrdersKanbanProps {
  columns: KanbanColumnData[];
}

export function OrdersKanban({ columns }: OrdersKanbanProps) {
  const router = useRouter();

  async function handleMoveItem(itemId: string, toColumnId: string) {
    const result = await updateOrderStatus(itemId, toColumnId);
    if (result?.error) {
      throw new Error(result.error);
    }
    router.refresh();
  }

  return <KanbanBoard columns={columns} onMoveItem={handleMoveItem} />;
}
