"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatus } from "@/actions/orders";
import { toast } from "@/lib/use-toast";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatusId: string;
  statuses: { id: string; name: string; color: string }[];
}

export function OrderStatusSelect({
  orderId,
  currentStatusId,
  statuses,
}: OrderStatusSelectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStatusChange(statusId: string) {
    if (statusId === currentStatusId) return;
    setLoading(statusId);
    try {
      const result = await updateOrderStatus(orderId, statusId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Статус обновлён");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Badge
          key={status.id}
          variant="outline"
          className={`cursor-pointer transition-colors ${
            currentStatusId === status.id
              ? "ring-2 ring-offset-1"
              : "hover:bg-muted"
          }`}
          style={{
            backgroundColor:
              currentStatusId === status.id
                ? status.color + "20"
                : undefined,
            color: status.color,
            borderColor: status.color,
          }}
          onClick={() => handleStatusChange(status.id)}
        >
          {loading === status.id ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : null}
          {status.name}
        </Badge>
      ))}
    </div>
  );
}
