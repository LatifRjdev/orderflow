"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, Loader2, Trash2 } from "lucide-react";
import { updateReconciliationStatus, deleteReconciliation } from "@/actions/reconciliations";

interface ReconciliationActionsProps {
  reconciliationId: string;
  status: string;
}

export function ReconciliationActions({ reconciliationId, status }: ReconciliationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatus(newStatus: any) {
    setLoading(newStatus);
    try {
      await updateReconciliationStatus(reconciliationId, newStatus);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить акт сверки?")) return;
    setLoading("delete");
    try {
      const result = await deleteReconciliation(reconciliationId);
      if (result.success) router.push("/documents?tab=reconciliations");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {status === "DRAFT" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleStatus("SENT")}
          disabled={loading !== null}
        >
          {loading === "SENT" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Отправить
        </Button>
      )}
      {status === "SENT" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleStatus("CONFIRMED")}
          disabled={loading !== null}
        >
          {loading === "CONFIRMED" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Подтвердить
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start text-destructive"
        onClick={handleDelete}
        disabled={loading !== null}
      >
        {loading === "delete" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
        Удалить
      </Button>
    </>
  );
}
