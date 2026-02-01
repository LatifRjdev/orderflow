"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Archive, ArchiveRestore, Loader2, Trash2 } from "lucide-react";
import { toggleClientArchive, deleteClient } from "@/actions/clients";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientActionsProps {
  clientId: string;
  isArchived: boolean;
  userRole?: string;
}

export function ClientActions({ clientId, isArchived, userRole }: ClientActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleArchive = () => {
    if (!confirm(isArchived ? "Разархивировать клиента?" : "Архивировать клиента?")) return;
    startTransition(async () => {
      const result = await toggleClientArchive(clientId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteClient(clientId);
      if (result.error) {
        alert(result.error);
        setShowDeleteAlert(false);
      } else {
        router.push("/clients");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/clients/${clientId}/edit`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Редактировать
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isArchived ? (
            <ArchiveRestore className="w-4 h-4 mr-2" />
          ) : (
            <Archive className="w-4 h-4 mr-2" />
          )}
          {isArchived ? "Разархивировать" : "Архивировать"}
        </Button>
        {userRole === "ADMIN" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </Button>
        )}
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Клиент и все его контактные лица будут безвозвратно удалены.
              Если у клиента есть заказы, удаление будет невозможно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
