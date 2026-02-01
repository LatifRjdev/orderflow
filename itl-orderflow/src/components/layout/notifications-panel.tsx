"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Settings,
  MessageCircle,
  Clock,
  CheckCircle,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

// --- Types ---

type NotificationType = "COMMENT" | "DEADLINE" | "STATUS" | "ASSIGNMENT";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string | Date;
}

// --- Helpers ---

const typeIconMap: Record<NotificationType, typeof MessageCircle> = {
  COMMENT: MessageCircle,
  DEADLINE: Clock,
  STATUS: CheckCircle,
  ASSIGNMENT: UserPlus,
};

const typeColorMap: Record<NotificationType, string> = {
  COMMENT: "text-blue-500",
  DEADLINE: "text-orange-500",
  STATUS: "text-green-500",
  ASSIGNMENT: "text-violet-500",
};

const groupLabels: Record<string, string> = {
  today: "Сегодня",
  yesterday: "Вчера",
  earlier: "Ранее",
};

function getGroupKey(dateStr: string | Date): "today" | "yesterday" | "earlier" {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  return "earlier";
}

function formatRelativeTime(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Component ---

export function NotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: data, unreadCount: count } = await getNotifications({
        unreadOnly: tab === "unread",
        limit: 30,
      });
      setNotifications(data as Notification[]);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // Fetch on mount (initial unread count)
  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadCount).catch((err) => console.error("Failed to fetch unread count:", err));
  }, []);

  // Fetch when panel opens or tab changes
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, tab, fetchNotifications]);

  // Poll unread count every 60 seconds when panel is closed
  useEffect(() => {
    const interval = setInterval(() => {
      if (!open) {
        getUnreadNotificationCount().then(setUnreadCount).catch((err) => console.error("Failed to fetch unread count:", err));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notif.linkUrl) {
      setOpen(false);
      router.push(notif.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filtered =
    tab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  // Group filtered notifications by date
  const groups: { key: string; label: string; items: Notification[] }[] = [];
  for (const groupKey of ["today", "yesterday", "earlier"] as const) {
    const items = filtered.filter((n) => getGroupKey(n.createdAt) === groupKey);
    if (items.length > 0) {
      groups.push({ key: groupKey, label: groupLabels[groupKey], items });
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg border shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Уведомления</h3>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Настройки уведомлений"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mark all read + Tabs */}
          <div className="px-4 pt-2 pb-1 border-b space-y-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Отметить все прочитанными
              </button>
            )}

            <div className="flex gap-1">
              <button
                onClick={() => setTab("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === "all"
                    ? "bg-gray-100 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setTab("unread")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === "unread"
                    ? "bg-gray-100 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                }`}
              >
                Непрочитанные{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            )}

            {!loading && groups.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Нет уведомлений
              </div>
            )}

            {groups.map((group) => (
              <div key={group.key}>
                {/* Group Header */}
                <div className="px-4 py-2 bg-gray-50/80">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>

                {/* Items */}
                {group.items.map((notif) => {
                  const Icon = typeIconMap[notif.type] || CheckCircle;
                  const iconColor = typeColorMap[notif.type] || "text-gray-500";

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.read ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {notif.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </div>

                        {/* Unread Dot */}
                        {!notif.read && (
                          <div className="mt-1.5 flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Все уведомления &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
