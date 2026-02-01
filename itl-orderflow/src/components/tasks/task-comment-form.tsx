"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { addTaskComment } from "@/actions/tasks";
import { toast } from "@/lib/use-toast";

interface TaskCommentFormProps {
  taskId: string;
}

export function TaskCommentForm({ taskId }: TaskCommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await addTaskComment(taskId, content.trim());
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
    <div className="mt-4 pt-4 border-t">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Написать комментарий..."
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
      />
      <div className="flex justify-end mt-2">
        <Button size="sm" onClick={handleSubmit} disabled={loading || !content.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Отправить
        </Button>
      </div>
    </div>
  );
}
