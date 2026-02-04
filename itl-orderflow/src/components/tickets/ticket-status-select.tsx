"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTicketStatus } from "@/actions/tickets";
import { toast } from "@/lib/use-toast";

interface TicketStatusSelectProps {
  ticketId: string;
  currentStatus: string;
}

const statusOptions = [
  { value: "OPEN", label: "Открыт" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "RESOLVED", label: "Решён" },
  { value: "CLOSED", label: "Закрыт" },
];

export function TicketStatusSelect({
  ticketId,
  currentStatus,
}: TicketStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setLoading(true);
    try {
      const result = await updateTicketStatus(ticketId, newStatus as any);
      if (result.error) {
        toast.error(result.error);
        setStatus(currentStatus);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
    </div>
  );
}
