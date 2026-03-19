"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Play, Archive, Loader2, Trash2 } from "lucide-react";
import { updateContractStatus, deleteContract } from "@/actions/contracts";

interface ContractActionsProps {
  contractId: string;
  status: string;
}

export function ContractActions({ contractId, status }: ContractActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatus(newStatus: any) {
    setLoading(newStatus);
    try {
      await updateContractStatus(contractId, newStatus);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить договор?")) return;
    setLoading("delete");
    try {
      const result = await deleteContract(contractId);
      if (result.success) router.push("/documents?tab=contracts");
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
        <>
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
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-destructive"
            onClick={() => handleStatus("TERMINATED")}
            disabled={loading !== null}
          >
            {loading === "TERMINATED" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Расторгнуть
          </Button>
        </>
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
