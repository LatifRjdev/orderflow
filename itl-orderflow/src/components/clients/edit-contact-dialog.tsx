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
import { Pencil, User, Mail, Phone, Loader2, Trash2 } from "lucide-react";
import { updateClientContact, deleteClientContact } from "@/actions/clients";

interface Contact {
  id: string;
  firstName: string;
  lastName?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  telegram?: string | null;
  isPrimary: boolean;
  isDecisionMaker: boolean;
}

interface EditContactDialogProps {
  clientId: string;
  contact: Contact;
}

export function EditContactDialog({ clientId, contact }: EditContactDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      const result = await updateClientContact(contact.id, clientId, data);
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

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteClientContact(contact.id, clientId);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка при удалении");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setShowDeleteConfirm(false); setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Редактирование контакта
          </DialogTitle>
          <DialogDescription>
            Измените информацию о контактном лице.
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
              <Label htmlFor={`edit-firstName-${contact.id}`}>Имя *</Label>
              <Input
                id={`edit-firstName-${contact.id}`}
                name="firstName"
                placeholder="Иван"
                defaultValue={contact.firstName}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-lastName-${contact.id}`}>Фамилия</Label>
              <Input
                id={`edit-lastName-${contact.id}`}
                name="lastName"
                placeholder="Иванов"
                defaultValue={contact.lastName || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-position-${contact.id}`}>Должность</Label>
            <Input
              id={`edit-position-${contact.id}`}
              name="position"
              placeholder="Генеральный директор"
              defaultValue={contact.position || ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-email-${contact.id}`}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={`edit-email-${contact.id}`}
                  name="email"
                  type="email"
                  placeholder="ivan@company.com"
                  className="pl-9"
                  defaultValue={contact.email || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-phone-${contact.id}`}>Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={`edit-phone-${contact.id}`}
                  name="phone"
                  placeholder="+7 (999) 123-45-67"
                  className="pl-9"
                  defaultValue={contact.phone || ""}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-telegram-${contact.id}`}>Telegram</Label>
            <Input
              id={`edit-telegram-${contact.id}`}
              name="telegram"
              placeholder="username"
              defaultValue={contact.telegram || ""}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPrimary"
                className="rounded border-input"
                defaultChecked={contact.isPrimary}
              />
              <span className="text-sm">Основной контакт</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isDecisionMaker"
                className="rounded border-input"
                defaultChecked={contact.isDecisionMaker}
              />
              <span className="text-sm">ЛПР</span>
            </label>
          </div>

          <DialogFooter className="flex !justify-between">
            <div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Удалить?</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Да"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Нет
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Удалить
                </Button>
              )}
            </div>
            <div className="flex gap-2">
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
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
