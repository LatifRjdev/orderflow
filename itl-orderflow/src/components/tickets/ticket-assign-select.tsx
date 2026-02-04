"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { assignTicket } from "@/actions/tickets";
import { toast } from "@/lib/use-toast";

interface TicketAssignSelectProps {
  ticketId: string;
  currentAssigneeId: string | null;
  users: { id: string; name: string | null; role: string }[];
}

export function TicketAssignSelect({
  ticketId,
  currentAssigneeId,
  users,
}: TicketAssignSelectProps) {
  const router = useRouter();
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId || "");
  const [loading, setLoading] = useState(false);

  async function handleChange(newId: string) {
    setAssigneeId(newId);
    setLoading(true);
    try {
      const result = await assignTicket(ticketId, newId || null);
      if (result.error) {
        toast.error(result.error);
        setAssigneeId(currentAssigneeId || "");
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
      setAssigneeId(currentAssigneeId || "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={assigneeId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
      >
        <option value="">Не назначен</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.id}
          </option>
        ))}
      </select>
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
    </div>
  );
}
