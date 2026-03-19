"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Trash2, User } from "lucide-react";
import { addClientNote, deleteClientNote } from "@/actions/clients";

interface ClientNote {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
  };
}

interface ClientNotesProps {
  clientId: string;
  notes: ClientNote[];
}

function formatRelative(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function ClientNotes({ clientId, notes }: ClientNotesProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const result = await addClientNote(clientId, text);
      if (result.success) {
        setText("");
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteClientNote(noteId, clientId);
      router.refresh();
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Заметки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Добавить заметку..."
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !text.trim()}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Notes timeline */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-muted rounded-full">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="font-medium">
                      {note.author?.name || "Пользователь"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatRelative(note.createdAt)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap pl-7">{note.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Заметок пока нет
          </p>
        )}
      </CardContent>
    </Card>
  );
}
