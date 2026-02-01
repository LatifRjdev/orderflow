"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Workflow,
  Bell,
  FileText,
  Save,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Puzzle,
  Send,
  X,
  UserX,
  UserCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/use-toast";
import { updateOrganizationSettings } from "@/actions/settings";
import { createUser, updateUser, toggleUserActive, resetUserPassword } from "@/actions/users";
import {
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
} from "@/actions/order-statuses";

type Tab = "organization" | "users" | "statuses" | "notifications" | "templates" | "integrations";

type SettingsData = {
  id: string;
  companyName: string;
  companyLegalName: string | null;
  companyLogo: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  companyInn: string | null;
  companyWebsite: string | null;
  bankName: string | null;
  bankAccount: string | null;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  orderPrefix: string;
  proposalPrefix: string;
  nextInvoiceNumber: number;
  nextOrderNumber: number;
  nextProposalNumber: number;
};

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  _count: { managedOrders: number; assignedTasks: number };
};

type StatusData = {
  id: string;
  name: string;
  code: string;
  color: string;
  position: number;
  isInitial: boolean;
  isFinal: boolean;
  notifyClient: boolean;
  isActive: boolean;
  _count: { orders: number };
};

interface SettingsClientProps {
  settings: SettingsData;
  users: UserData[];
  statuses: StatusData[];
}

export function SettingsClient({ settings, users, statuses }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("organization");

  const tabs = [
    { id: "organization" as Tab, title: "Организация", icon: Building2, color: "text-blue-500" },
    { id: "users" as Tab, title: "Пользователи", icon: Users, color: "text-green-500" },
    { id: "statuses" as Tab, title: "Статусы заказов", icon: Workflow, color: "text-purple-500" },
    { id: "notifications" as Tab, title: "Уведомления", icon: Bell, color: "text-amber-500" },
    { id: "templates" as Tab, title: "Шаблоны", icon: FileText, color: "text-indigo-500" },
    { id: "integrations" as Tab, title: "Интеграции", icon: Puzzle, color: "text-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm">
          Управление настройками системы
        </p>
      </div>

      <div className="flex gap-6">
        <nav className="w-64 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-gray-100 text-muted-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-primary" : tab.color}`} />
              {tab.title}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === "organization" && <OrganizationSettings settings={settings} />}
          {activeTab === "users" && <UsersSettings users={users} />}
          {activeTab === "statuses" && <StatusesSettings statuses={statuses} />}
          {activeTab === "notifications" && <NotificationsSettings />}
          {activeTab === "templates" && <PlaceholderSection title="Шаблоны документов" />}
          {activeTab === "integrations" && <PlaceholderSection title="Интеграции" />}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   Organization Settings
   ============================================================================= */

function OrganizationSettings({ settings }: { settings: SettingsData }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOrganizationSettings(formData);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Сохранено", description: "Настройки организации обновлены" });
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Профиль организации</CardTitle>
            <CardDescription>Основная информация о компании</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название компании</Label>
                <Input name="companyName" defaultValue={settings.companyName} required />
              </div>
              <div className="space-y-2">
                <Label>Юридическое название</Label>
                <Input name="companyLegalName" defaultValue={settings.companyLegalName || ""} />
              </div>
              <div className="space-y-2">
                <Label>ИНН</Label>
                <Input name="companyInn" defaultValue={settings.companyInn || ""} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="companyEmail" type="email" defaultValue={settings.companyEmail || ""} />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input name="companyPhone" defaultValue={settings.companyPhone || ""} />
              </div>
              <div className="space-y-2">
                <Label>Сайт</Label>
                <Input name="companyWebsite" defaultValue={settings.companyWebsite || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Адрес</Label>
              <Textarea name="companyAddress" defaultValue={settings.companyAddress || ""} rows={2} />
            </div>

            <Separator />

            <h3 className="font-medium">Банковские реквизиты</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Банк</Label>
                <Input name="bankName" defaultValue={settings.bankName || ""} />
              </div>
              <div className="space-y-2">
                <Label>Расчётный счёт</Label>
                <Input name="bankAccount" defaultValue={settings.bankAccount || ""} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                <Save className="w-4 h-4 mr-2" />
                {isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

/* =============================================================================
   Users Settings
   ============================================================================= */

function UsersSettings({ users }: { users: UserData[] }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const roleLabels: Record<string, string> = {
    ADMIN: "Администратор",
    MANAGER: "Менеджер",
    DEVELOPER: "Разработчик",
    VIEWER: "Наблюдатель",
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    MANAGER: "bg-blue-100 text-blue-700",
    DEVELOPER: "bg-purple-100 text-purple-700",
    VIEWER: "bg-gray-100 text-gray-700",
  };

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Готово", description: "Пользователь создан" });
        setInviteOpen(false);
        router.refresh();
      }
    });
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUser(editUser.id, formData);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Готово", description: "Пользователь обновлён" });
        setEditUser(null);
        router.refresh();
      }
    });
  };

  const handleToggleActive = (user: UserData) => {
    startTransition(async () => {
      const result = await toggleUserActive(user.id);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({
          title: "Готово",
          description: user.isActive ? "Пользователь деактивирован" : "Пользователь активирован",
        });
        router.refresh();
      }
    });
  };

  const handleResetPassword = () => {
    if (!resetPasswordUser) return;
    startTransition(async () => {
      const result = await resetUserPassword(resetPasswordUser.id, newPassword);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Готово", description: "Пароль сброшен" });
        setResetPasswordUser(null);
        setNewPassword("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Пользователи</CardTitle>
            <CardDescription>Управление пользователями системы</CardDescription>
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Имя</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Роль</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Статус</th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="py-3 px-6 font-medium">{user.name || "—"}</td>
                    <td className="py-3 px-6 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-6">
                      <Badge className={roleColors[user.role] || "bg-gray-100 text-gray-700"}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-6">
                      <Badge variant={user.isActive ? "success" : "secondary"}>
                        {user.isActive ? "Активен" : "Отключён"}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditUser(user)} title="Редактировать">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setResetPasswordUser(user)} title="Сбросить пароль">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(user)}
                        title={user.isActive ? "Деактивировать" : "Активировать"}
                      >
                        {user.isActive ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить пользователя</DialogTitle>
            <DialogDescription>Создайте нового пользователя системы</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="user-name">Имя</Label>
                <Input id="user-name" name="name" required placeholder="Иван Петров" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" name="email" type="email" required placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Пароль</Label>
                <Input id="user-password" name="password" type="password" required minLength={6} placeholder="Минимум 6 символов" />
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Администратор</SelectItem>
                    <SelectItem value="MANAGER">Менеджер</SelectItem>
                    <SelectItem value="DEVELOPER">Разработчик</SelectItem>
                    <SelectItem value="VIEWER">Наблюдатель</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                <Plus className="w-4 h-4 mr-2" />
                {isPending ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input name="name" defaultValue={editUser?.name || ""} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={editUser?.email || ""} required />
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
                <Select name="role" defaultValue={editUser?.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Администратор</SelectItem>
                    <SelectItem value="MANAGER">Менеджер</SelectItem>
                    <SelectItem value="DEVELOPER">Разработчик</SelectItem>
                    <SelectItem value="VIEWER">Наблюдатель</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditUser(null)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) { setResetPasswordUser(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
            <DialogDescription>
              Новый пароль для {resetPasswordUser?.name || resetPasswordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                placeholder="Минимум 6 символов"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordUser(null); setNewPassword(""); }}>
              Отмена
            </Button>
            <Button onClick={handleResetPassword} disabled={isPending || newPassword.length < 6}>
              {isPending ? "Сброс..." : "Сбросить пароль"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =============================================================================
   Statuses Settings
   ============================================================================= */

function StatusesSettings({ statuses }: { statuses: StatusData[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StatusData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOrderStatus(formData);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Готово", description: "Статус создан" });
        setCreateOpen(false);
        router.refresh();
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStatus) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOrderStatus(editingStatus.id, formData);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Готово", description: "Статус обновлён" });
        setEditingStatus(null);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    startTransition(async () => {
      const result = await deleteOrderStatus(deleteConfirm.id);
      if (result.error) {
        toast({ title: "Ошибка", description: result.error, type: "error" });
      } else {
        toast({ title: "Готово", description: "Статус удалён" });
        router.refresh();
      }
      setDeleteConfirm(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Visual Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline статусов</CardTitle>
          <CardDescription>Визуальный поток обработки заказов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {statuses.filter(s => s.isActive).map((status, idx, arr) => (
              <div key={status.id} className="flex items-center flex-shrink-0">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium"
                  style={{ borderColor: status.color, color: status.color }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </div>
                {idx < arr.length - 1 && (
                  <svg className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Статусы заказов</CardTitle>
          <CardDescription>Настройте pipeline статусов для заказов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 px-3 pb-2 border-b">
            <div className="w-4" />
            <div className="w-4" />
            <div className="flex-1 text-xs font-medium text-muted-foreground">Статус</div>
            <div className="w-16 text-center text-xs font-medium text-muted-foreground">Заказов</div>
            <div className="w-20 text-center text-xs font-medium text-muted-foreground">Начальный</div>
            <div className="w-20 text-center text-xs font-medium text-muted-foreground">Конечный</div>
            <div className="w-24 text-center text-xs font-medium text-muted-foreground">Уведомлять</div>
            <div className="w-20" />
          </div>

          {statuses.map((status) => (
            <div
              key={status.id}
              className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50/50 ${!status.isActive ? "opacity-50" : ""}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: status.color }}
              />
              <div className="flex-1">
                <span className="font-medium text-sm">{status.name}</span>
                <span className="text-xs text-muted-foreground ml-2">({status.code})</span>
                {!status.isActive && <Badge variant="secondary" className="ml-2 text-xs">Отключён</Badge>}
              </div>
              <div className="w-16 text-center text-sm text-muted-foreground">
                {status._count.orders}
              </div>
              <div className="w-20 text-center">
                {status.isInitial && <Badge className="bg-blue-100 text-blue-700 text-xs">Да</Badge>}
              </div>
              <div className="w-20 text-center">
                {status.isFinal && <Badge className="bg-green-100 text-green-700 text-xs">Да</Badge>}
              </div>
              <div className="w-24 text-center">
                {status.notifyClient && <Badge className="bg-amber-100 text-amber-700 text-xs">Да</Badge>}
              </div>
              <div className="w-20 flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingStatus(status)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => setDeleteConfirm(status)}
                  disabled={status._count.orders > 0}
                  title={status._count.orders > 0 ? "Нельзя удалить: есть заказы" : "Удалить"}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          <div className="pt-4">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить статус
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Status Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый статус</DialogTitle>
            <DialogDescription>Создайте новый статус для заказов</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input name="name" required placeholder="В работе" />
                </div>
                <div className="space-y-2">
                  <Label>Код</Label>
                  <Input name="code" required placeholder="IN_PROGRESS" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <Input name="color" type="color" defaultValue="#6B7280" className="h-10 w-20" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isInitial" value="true" className="rounded" />
                  Начальный
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isFinal" value="true" className="rounded" />
                  Конечный
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="notifyClient" value="true" className="rounded" />
                  Уведомлять клиента
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={!!editingStatus} onOpenChange={(open) => !open && setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать статус</DialogTitle>
            <DialogDescription>{editingStatus?.code}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input name="name" defaultValue={editingStatus?.name} required />
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <Input name="color" type="color" defaultValue={editingStatus?.color || "#6B7280"} className="h-10 w-20" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isInitial" value="true" defaultChecked={editingStatus?.isInitial} className="rounded" />
                  Начальный
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isFinal" value="true" defaultChecked={editingStatus?.isFinal} className="rounded" />
                  Конечный
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="notifyClient" value="true" defaultChecked={editingStatus?.notifyClient} className="rounded" />
                  Уведомлять клиента
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" value="true" defaultChecked={editingStatus?.isActive} className="rounded" />
                  Активен
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingStatus(null)}>Отмена</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статус &quot;{deleteConfirm?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Статус будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* =============================================================================
   Notifications Settings (read-only display for now)
   ============================================================================= */

function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
          <CardDescription>
            Настройка уведомлений доступна через системные настройки.
            Уведомления в системе работают автоматически.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Смена статуса заказа</p>
                <p className="text-xs text-muted-foreground">Уведомления менеджеру и клиенту</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Активно</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Новый комментарий</p>
                <p className="text-xs text-muted-foreground">Уведомления участникам обсуждения</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Активно</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Этап готов к проверке</p>
                <p className="text-xs text-muted-foreground">Уведомление клиенту по email</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Активно</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Новое КП / ответ клиента</p>
                <p className="text-xs text-muted-foreground">Уведомления о предложениях</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Активно</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =============================================================================
   Placeholder for Templates and Integrations
   ============================================================================= */

function PlaceholderSection({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Функция в разработке</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Puzzle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-lg mb-1">Скоро</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Эта функция находится в разработке и будет доступна в ближайшем обновлении.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
