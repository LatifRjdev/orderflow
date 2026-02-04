"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Clock,
  DollarSign,
  FileText,
  MessageCircle,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Дашборд", href: "/", icon: LayoutDashboard },
  { name: "Заказы", href: "/orders", icon: FolderKanban },
  { name: "Клиенты", href: "/clients", icon: Users },
  { name: "Задачи", href: "/tasks", icon: CheckSquare },
  { name: "Время", href: "/time", icon: Clock },
  { name: "Финансы", href: "/finance", icon: DollarSign },
  { name: "Предложения", href: "/proposals", icon: FileText },
  { name: "Обращения", href: "/tickets", icon: MessageCircle },
  { name: "Отчёты", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-muted">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">OrderFlow</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-muted space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-primary text-white"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Настройки</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 shrink-0" />
              <span>Свернуть</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
