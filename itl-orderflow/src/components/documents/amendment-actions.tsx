"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, Loader2, Trash2 } from "lucide-react";
import { updateAmendmentStatus, deleteAmendment } from "@/actions/amendments";

interface AmendmentActionsProps {
  amendmentId: string;
  status: string;
}

export function AmendmentActions({ amendmentId, status }: AmendmentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatus(newStatus: any) {
    setLoading(newStatus);
    try {
      await updateAmendmentStatus(amendmentId, newStatus);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить доп. соглашение?")) return;
    setLoading("delete");
    try {
      const result = await deleteAmendment(amendmentId);
      if (result.success) router.push("/documents?tab=amendments");
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
          onClick={() => handleStatus("ACTIVE")}
          disabled={loading !== null}
        >
          {loading === "ACTIVE" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Активировать
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleStatus("COMPLETED")}
          disabled={loading !== null}
        >
          {loading === "COMPLETED" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Завершить
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
