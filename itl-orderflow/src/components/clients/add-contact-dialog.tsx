"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User, Mail, Phone, Loader2 } from "lucide-react";
import { addClientContact } from "@/actions/clients";

interface AddContactDialogProps {
  clientId: string;
  children?: React.ReactNode;
}

export function AddContactDialog({ clientId, children }: AddContactDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: (formData.get("lastName") as string) || undefined,
      position: (formData.get("position") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      telegram: (formData.get("telegram") as string) || undefined,
      isPrimary: formData.get("isPrimary") === "on",
      isDecisionMaker: formData.get("isDecisionMaker") === "on",
    };

    if (!data.firstName.trim()) {
      setError("Имя обязательно");
      setIsLoading(false);
      return;
    }

    try {
      const result = await addClientContact(clientId, data);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Новое контактное лицо
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о контактном лице клиента.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя *</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Иван"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Иванов"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Должность</Label>
            <Input
              id="position"
              name="position"
              placeholder="Генеральный директор"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ivan@company.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+7 (999) 123-45-67"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              name="telegram"
              placeholder="username"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPrimary"
                className="rounded border-input"
              />
              <span className="text-sm">Основной контакт</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isDecisionMaker"
                className="rounded border-input"
              />
              <span className="text-sm">ЛПР</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
