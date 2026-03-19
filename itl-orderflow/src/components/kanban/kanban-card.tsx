"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { getInitials } from "@/lib/utils";

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle?: string;
  number?: string;
  href: string;
  priority?: string;
  deadline?: string;
  assignee?: string;
  progress?: number;
  taskCount?: number;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Низкий", className: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Средний", className: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Высокий", className: "bg-amber-100 text-amber-700" },
  URGENT: { label: "Срочный", className: "bg-red-100 text-red-700" },
};

interface KanbanCardProps {
  item: KanbanCardData;
  renderCard?: (item: KanbanCardData) => React.ReactNode;
  isDragOverlay?: boolean;
}

export function KanbanCard({ item, renderCard, isDragOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (renderCard) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`${isDragging ? "opacity-30" : ""}`}
      >
        {renderCard(item)}
      </div>
    );
  }

  const priority = item.priority ? priorityConfig[item.priority] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? "opacity-30" : ""}`}
    >
      <Link href={item.href}>
        <div className="bg-white rounded-lg border border-[#dbdfe6] p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          {/* Top: Number + Priority */}
          <div className="flex items-start justify-between mb-2">
            {item.number && (
              <span className="text-xs text-gray-400 font-mono">{item.number}</span>
            )}
            {priority && (
              <Badge className={`text-[10px] ${priority.className}`}>
                {priority.label}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm mb-1 line-clamp-2">{item.title}</h4>

          {/* Subtitle */}
          {item.subtitle && (
            <p className="text-xs text-gray-500 mb-2">{item.subtitle}</p>
          )}

          {/* Progress */}
          {item.progress != null && (
            <div className="mb-2">
              <div className="w-full h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              {item.deadline ? (
                <>
                  <Calendar className="w-3 h-3" />
                  {item.deadline}
                </>
              ) : item.taskCount != null ? (
                <span>{item.taskCount} задач</span>
              ) : null}
            </div>
            {item.assignee && (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(item.assignee)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
