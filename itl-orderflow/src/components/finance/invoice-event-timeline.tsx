import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CirclePlus,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRightLeft,
  History,
} from "lucide-react";

interface InvoiceEvent {
  id: string;
  type: string;
  note: string | null;
  createdAt: Date;
}

interface InvoiceEventTimelineProps {
  events: InvoiceEvent[];
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  CREATED: { icon: CirclePlus, color: "text-blue-500", label: "Создан" },
  REMINDER_SENT: { icon: Send, color: "text-indigo-500", label: "Напоминание отправлено" },
  PAID: { icon: CheckCircle, color: "text-green-500", label: "Оплата" },
  OVERDUE: { icon: AlertTriangle, color: "text-red-500", label: "Просрочен" },
  CANCELLED: { icon: XCircle, color: "text-gray-500", label: "Отменён" },
  STATUS_CHANGED: { icon: ArrowRightLeft, color: "text-amber-500", label: "Статус изменён" },
};

function formatEventDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvoiceEventTimeline({ events }: InvoiceEventTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" />
          История событий
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {events.map((event) => {
            const config = eventConfig[event.type] || {
              icon: History,
              color: "text-muted-foreground",
              label: event.type,
            };
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative flex items-start gap-3 pl-0">
                <div
                  className={`relative z-10 p-1 rounded-full bg-background border ${config.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium">{config.label}</p>
                  {event.note && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.note}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEventDate(event.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
