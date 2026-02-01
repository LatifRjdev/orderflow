"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  Settings,
  X,
  FileText,
  Users,
  ClipboardList,
  Briefcase,
  Loader2,
  MessageCircle,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth";
import { globalSearch, type SearchResult } from "@/actions/search";
import { getInitials } from "@/lib/utils";
import { NotificationsPanel } from "@/components/layout/notifications-panel";

interface HeaderProps {
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

const typeIcons = {
  order: Briefcase,
  client: Users,
  task: ClipboardList,
};

const typeLabels = {
  order: "Заказы",
  client: "Клиенты",
  task: "Задачи",
};

const quickLinks = [
  { label: "Заказы", icon: Briefcase, href: "/orders" },
  { label: "Клиенты", icon: Users, href: "/clients" },
  { label: "Задачи", icon: ClipboardList, href: "/tasks" },
  { label: "Финансы", icon: FileText, href: "/finance" },
  { label: "Настройки", icon: Settings, href: "/settings" },
];

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, startSearch] = useTransition();
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const userName = user?.name || "Пользователь";
  const userEmail = user?.email || "";
  const userRole = user?.role || "EMPLOYEE";
  const userImage = user?.image || "";
  const initials = getInitials(userName);

  // ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const results = await globalSearch(searchQuery);
        setSearchResults(results);
        setSelectedIndex(0);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      setSearchOpen(false);
      router.push(href);
    },
    [router]
  );

  // All navigable items for keyboard nav
  const allItems = searchQuery.length >= 2
    ? searchResults.map((r) => ({ href: r.href, label: r.title }))
    : quickLinks.map((l) => ({ href: l.href, label: l.label }));

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems.length > 0) {
      e.preventDefault();
      navigateTo(allItems[selectedIndex]?.href || allItems[0].href);
    }
  };

  // Group search results by type
  const groupedResults: Record<string, SearchResult[]> = {};
  for (const r of searchResults) {
    if (!groupedResults[r.type]) groupedResults[r.type] = [];
    groupedResults[r.type].push(r);
  }

  let flatIndex = 0;

  return (
    <>
      <header className="h-16 border-b bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <nav className="text-sm text-muted-foreground">
            <span>ITL OrderFlow</span>
          </nav>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-muted-foreground"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Поиск...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-white border rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat / Написать */}
          <Button variant="ghost" size="icon" onClick={() => router.push("/proposals/new")} title="Написать">
            <MessageCircle className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <NotificationsPanel />

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => { setProfileOpen(!profileOpen); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Avatar className="w-8 h-8">
                {userImage && <AvatarImage src={userImage} alt={userName} />}
                <AvatarFallback className="bg-primary text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block">{userName}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border shadow-lg z-50">
                <div className="px-4 py-3 border-b">
                  <p className="font-medium text-sm">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{roleLabels[userRole] || userRole}</Badge>
                </div>
                <div className="py-1">
                  <button onClick={() => { setProfileOpen(false); router.push("/profile"); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Профиль
                  </button>
                  <button onClick={() => { setProfileOpen(false); router.push("/settings"); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Настройки
                  </button>
                  <form action={logoutAction}>
                    <button type="submit" className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-destructive">
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border">
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск заказов, клиентов, задач..."
                className="flex-1 outline-none text-sm"
                onKeyDown={handleSearchKeyDown}
              />
              {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <button onClick={() => setSearchOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="py-2 max-h-80 overflow-y-auto">
              {/* No query — show quick links */}
              {searchQuery.length < 2 && (
                <>
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Быстрый переход</p>
                  </div>
                  {quickLinks.map((link, idx) => (
                    <button
                      key={link.href}
                      onClick={() => navigateTo(link.href)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${idx === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                    >
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{link.label}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Has query — show results */}
              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  По запросу &quot;{searchQuery}&quot; ничего не найдено
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length > 0 && (
                <>
                  {(["order", "client", "task"] as const).map((type) => {
                    const items = groupedResults[type];
                    if (!items || items.length === 0) return null;
                    const Icon = typeIcons[type];
                    return (
                      <div key={type}>
                        <div className="px-3 py-1.5 flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {typeLabels[type]}
                          </p>
                        </div>
                        {items.map((result) => {
                          const thisIndex = flatIndex++;
                          return (
                            <button
                              key={result.id}
                              onClick={() => navigateTo(result.href)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${thisIndex === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                            >
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm truncate">{result.title}</p>
                                {result.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="px-4 py-2 border-t flex items-center gap-4 text-xs text-muted-foreground">
              <span><kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">↑↓</kbd> навигация</span>
              <span><kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">↵</kbd> выбрать</span>
              <span><kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">esc</kbd> закрыть</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
