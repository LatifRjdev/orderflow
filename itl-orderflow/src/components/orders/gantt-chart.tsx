"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GanttTask {
  id: string;
  title: string;
  status: string;
  startDate: string | Date | null;
  dueDate: string | Date | null;
  assignee?: string;
  isMilestone?: boolean;
  milestoneTitle?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  orderDeadline?: string | Date | null;
}

const statusColors: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
  CANCELLED: "bg-red-300",
  PENDING: "bg-gray-400",
  COMPLETED: "bg-green-500",
  APPROVED: "bg-green-600",
};

export function GanttChart({ tasks, orderDeadline }: GanttChartProps) {
  const [offsetWeeks, setOffsetWeeks] = useState(0);

  // Calculate date range
  const { startDate, days, dayLabels, weekLabel } = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + offsetWeeks * 7);

    // Show 4 weeks centered on current week
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = new Date(now);
    start.setDate(start.getDate() + mondayOffset - 7); // Start 1 week before
    start.setHours(0, 0, 0, 0);

    const totalDays = 28; // 4 weeks
    const daysArr: Date[] = [];
    const labels: { day: number; month: string; isWeekend: boolean; isToday: boolean }[] = [];
    const months = [
      "янв", "фев", "мар", "апр", "мая", "июн",
      "июл", "авг", "сен", "окт", "ноя", "дек",
    ];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      daysArr.push(d);
      const dow = d.getDay();
      labels.push({
        day: d.getDate(),
        month: months[d.getMonth()],
        isWeekend: dow === 0 || dow === 6,
        isToday: d.getTime() === today.getTime(),
      });
    }

    const end = new Date(start);
    end.setDate(end.getDate() + totalDays - 1);
    const wl = `${start.getDate()} ${months[start.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;

    return { startDate: start, days: daysArr, dayLabels: labels, weekLabel: wl };
  }, [offsetWeeks]);

  // Convert tasks to bars
  const bars = useMemo(() => {
    return tasks
      .filter((t) => t.startDate || t.dueDate)
      .map((task) => {
        const taskStart = task.startDate ? new Date(task.startDate) : null;
        const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

        const effectiveStart = taskStart || taskEnd!;
        const effectiveEnd = taskEnd || taskStart!;

        const rangeStart = startDate.getTime();
        const msPerDay = 1000 * 60 * 60 * 24;

        const startCol = Math.max(
          0,
          Math.floor((effectiveStart.getTime() - rangeStart) / msPerDay)
        );
        const endCol = Math.min(
          27,
          Math.floor((effectiveEnd.getTime() - rangeStart) / msPerDay)
        );

        const span = Math.max(1, endCol - startCol + 1);
        const isVisible = startCol <= 27 && endCol >= 0;

        return {
          ...task,
          startCol: Math.max(0, startCol),
          span,
          isVisible,
          color: statusColors[task.status] || "bg-gray-400",
        };
      });
  }, [tasks, startDate]);

  // Today line position
  const todayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const idx = Math.floor((today.getTime() - startDate.getTime()) / msPerDay);
    return idx >= 0 && idx < 28 ? idx : -1;
  }, [startDate]);

  if (tasks.length === 0 || !bars.some((b) => b.isVisible)) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Нет задач с датами для отображения на диаграмме.
        <br />
        Установите даты начала и окончания для задач и этапов.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOffsetWeeks((o) => o - 2)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[220px] text-center">
            {weekLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOffsetWeeks((o) => o + 2)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {offsetWeeks !== 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffsetWeeks(0)}
            >
              Сегодня
            </Button>
          )}
        </div>
        <div className="flex gap-3 text-xs">
          {Object.entries({
            "К выполнению": "bg-gray-400",
            "В работе": "bg-blue-500",
            "На проверке": "bg-purple-500",
            "Готово": "bg-green-500",
          }).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <div className={cn("w-3 h-2 rounded-sm", color)} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto border rounded-lg">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="flex border-b bg-gray-50/50">
            <div className="w-[200px] shrink-0 py-2 px-3 text-xs font-medium text-muted-foreground border-r">
              Задача
            </div>
            <div className="flex-1 flex">
              {dayLabels.map((dl, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 text-center py-1 text-[10px] border-r last:border-0",
                    dl.isWeekend && "bg-gray-100/80",
                    dl.isToday && "bg-blue-50 font-bold text-blue-600"
                  )}
                >
                  <div>{dl.day}</div>
                  {(i === 0 || dl.day === 1) && (
                    <div className="text-muted-foreground">{dl.month}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          {bars
            .filter((b) => b.isVisible)
            .map((bar) => (
              <div key={bar.id} className="flex border-b last:border-0 hover:bg-gray-50/30">
                <div className="w-[200px] shrink-0 py-2 px-3 border-r">
                  <div className="text-xs font-medium truncate" title={bar.title}>
                    {bar.isMilestone && (
                      <span className="text-muted-foreground mr-1">◆</span>
                    )}
                    {bar.title}
                  </div>
                  {bar.milestoneTitle && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {bar.milestoneTitle}
                    </div>
                  )}
                </div>
                <div className="flex-1 relative flex">
                  {/* Grid lines */}
                  {dayLabels.map((dl, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 border-r last:border-0",
                        dl.isWeekend && "bg-gray-100/40"
                      )}
                    />
                  ))}

                  {/* Today line */}
                  {todayIndex >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                      style={{
                        left: `${((todayIndex + 0.5) / 28) * 100}%`,
                      }}
                    />
                  )}

                  {/* Bar */}
                  <div
                    className={cn(
                      "absolute top-1.5 h-5 rounded-sm z-20 opacity-90",
                      bar.color
                    )}
                    style={{
                      left: `${(bar.startCol / 28) * 100}%`,
                      width: `${(bar.span / 28) * 100}%`,
                    }}
                    title={`${bar.title}: ${bar.status}`}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
