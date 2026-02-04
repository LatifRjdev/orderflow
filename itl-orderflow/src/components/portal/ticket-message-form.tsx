"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addPortalTicketMessage } from "@/actions/tickets";
import { toast } from "@/lib/use-toast";

interface PortalTicketMessageFormProps {
  clientId: string;
  clientName: string;
  ticketId: string;
}

export function PortalTicketMessageForm({
  clientId,
  clientName,
  ticketId,
}: PortalTicketMessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await addPortalTicketMessage(
        clientId,
        ticketId,
        content.trim(),
        clientName
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
        placeholder="Написать сообщение..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
          }
        }}
      />
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          disabled={!content.trim() || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Отправить
        </Button>
      </div>
    </div>
  );
}
