"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, Archive, Loader2, Trash2 } from "lucide-react";
import { updateTechSpecStatus, deleteTechSpec } from "@/actions/tech-specs";

interface TechSpecActionsProps {
  specId: string;
  status: string;
}

export function TechSpecActions({ specId, status }: TechSpecActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatus(newStatus: any) {
    setLoading(newStatus);
    try {
      await updateTechSpecStatus(specId, newStatus);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить ТЗ?")) return;
    setLoading("delete");
    try {
      const result = await deleteTechSpec(specId);
      if (result.success) router.push("/documents?tab=specs");
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
          onClick={() => handleStatus("REVIEW")}
          disabled={loading !== null}
        >
          {loading === "REVIEW" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
          На проверку
        </Button>
      )}
      {status === "REVIEW" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleStatus("APPROVED")}
          disabled={loading !== null}
        >
          {loading === "APPROVED" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Утвердить
        </Button>
      )}
      {(status === "APPROVED" || status === "REVIEW") && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleStatus("ARCHIVED")}
          disabled={loading !== null}
        >
          {loading === "ARCHIVED" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
          В архив
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
