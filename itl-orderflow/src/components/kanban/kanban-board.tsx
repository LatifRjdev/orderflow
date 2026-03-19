"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard, type KanbanCardData } from "./kanban-card";

export interface KanbanColumnData {
  id: string;
  title: string;
  color: string;
  items: KanbanCardData[];
}

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onMoveItem: (itemId: string, toColumnId: string) => Promise<void>;
  renderCard?: (item: KanbanCardData) => React.ReactNode;
}

export function KanbanBoard({ columns, onMoveItem, renderCard }: KanbanBoardProps) {
  const [boardColumns, setBoardColumns] = useState(columns);
  const [activeItem, setActiveItem] = useState<KanbanCardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const findColumnByItemId = useCallback(
    (itemId: string) => {
      return boardColumns.find((col) =>
        col.items.some((item) => item.id === itemId)
      );
    },
    [boardColumns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const column = findColumnByItemId(active.id as string);
    if (column) {
      const item = column.items.find((i) => i.id === active.id);
      if (item) setActiveItem(item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByItemId(activeId);
    const overColumn =
      boardColumns.find((col) => col.id === overId) ||
      findColumnByItemId(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    setBoardColumns((prev) => {
      const activeItems = activeColumn.items.filter((i) => i.id !== activeId);
      const movedItem = activeColumn.items.find((i) => i.id === activeId);
      if (!movedItem) return prev;

      const overItems = [...overColumn.items, movedItem];

      return prev.map((col) => {
        if (col.id === activeColumn.id) return { ...col, items: activeItems };
        if (col.id === overColumn.id) return { ...col, items: overItems };
        return col;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overColumn =
      boardColumns.find((col) => col.id === over.id) ||
      findColumnByItemId(over.id as string);

    if (overColumn) {
      try {
        await onMoveItem(activeId, overColumn.id);
      } catch {
        // Revert on error
        setBoardColumns(columns);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {boardColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            count={column.items.length}
          >
            <SortableContext
              items={column.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 min-h-[40px]">
                {column.items.map((item) => (
                  <KanbanCard key={item.id} item={item} renderCard={renderCard} />
                ))}
              </div>
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="opacity-80 rotate-2">
            <KanbanCard item={activeItem} renderCard={renderCard} isDragOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
