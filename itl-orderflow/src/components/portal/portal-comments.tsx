"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addPortalComment } from "@/actions/portal";
import { toast } from "@/lib/use-toast";

interface PortalCommentFormProps {
  clientId: string;
  clientName: string;
  orderId: string;
}

export function PortalCommentForm({
  clientId,
  clientName,
  orderId,
}: PortalCommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await addPortalComment(
        clientId,
        orderId,
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
        placeholder="Оставить комментарий..."
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
