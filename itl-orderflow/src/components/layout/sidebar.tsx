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
  Files,
  MessageCircle,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const navigation = [
  { name: "Дашборд", href: "/", icon: LayoutDashboard },
  { name: "Заказы", href: "/orders", icon: FolderKanban },
  { name: "Клиенты", href: "/clients", icon: Users },
  { name: "Задачи", href: "/tasks", icon: CheckSquare },
  { name: "Время", href: "/time", icon: Clock },
  { name: "Финансы", href: "/finance", icon: DollarSign },
  { name: "Предложения", href: "/proposals", icon: FileText },
  { name: "Документы", href: "/documents", icon: Files },
  { name: "Обращения", href: "/tickets", icon: MessageCircle },
  { name: "Отчёты", href: "/reports", icon: BarChart3 },
];

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  };
}

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  EMPLOYEE: "Сотрудник",
  DEVELOPER: "Разработчик",
  VIEWER: "Наблюдатель",
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userName = user?.name || "Пользователь";
  const userRole = user?.role || "EMPLOYEE";
  const userImage = user?.image || "";
  const initials = getInitials(userName);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-white leading-none">
                ITL OrderFlow
              </span>
              <span className="text-slate-400 text-xs mt-1">
                Management System
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-6 space-y-1">
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
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-muted pt-4 pb-4 px-4 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-slate-400 hover:text-white hover:bg-sidebar-accent"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Настройки</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-slate-400 hover:text-white hover:bg-sidebar-accent transition-colors"
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

      {/* User Profile */}
      {!collapsed && user && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-2.5 bg-sidebar-accent/50 rounded-xl">
            <Avatar className="w-8 h-8 shrink-0">
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="bg-slate-700 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {roleLabels[userRole] || userRole}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
