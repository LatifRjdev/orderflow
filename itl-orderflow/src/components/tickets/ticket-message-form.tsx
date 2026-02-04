"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addTicketMessage } from "@/actions/tickets";
import { toast } from "@/lib/use-toast";

interface TicketMessageFormProps {
  ticketId: string;
}

export function TicketMessageForm({ ticketId }: TicketMessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await addTicketMessage(ticketId, content.trim(), isInternal);
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
        placeholder={isInternal ? "Внутренняя заметка (не видна клиенту)..." : "Ответ клиенту..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded border-input"
          />
          <span className={isInternal ? "text-amber-600 font-medium" : "text-muted-foreground"}>
            Внутренняя заметка
          </span>
        </label>
        <Button
          size="sm"
          disabled={!content.trim() || loading}
          onClick={handleSubmit}
          variant={isInternal ? "outline" : "default"}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isInternal ? "Добавить заметку" : "Отправить"}
        </Button>
      </div>
    </div>
  );
}
