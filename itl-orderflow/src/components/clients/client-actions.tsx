"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toggleClientArchive } from "@/actions/clients";

interface ClientActionsProps {
  clientId: string;
  isArchived: boolean;
}

export function ClientActions({ clientId, isArchived }: ClientActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
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
    </div>
  );
}
