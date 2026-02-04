"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPortalTicket } from "@/actions/tickets";
import { toast } from "@/lib/use-toast";

interface PortalTicketFormProps {
  clientId: string;
  clientName: string;
  orders: { id: string; number: string; title: string }[];
}

export function PortalTicketForm({
  clientId,
  clientName,
  orders,
}: PortalTicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [orderId, setOrderId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const result = await createPortalTicket(
        clientId,
        {
          subject: subject.trim(),
          description: description.trim(),
          priority: priority as any,
          orderId: orderId || undefined,
        },
        clientName
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        router.push("/portal/tickets");
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Новое обращение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Тема <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Кратко опишите суть обращения"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-none"
              placeholder="Подробно опишите ваш вопрос или проблему..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Приоритет
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
                <option value="URGENT">Срочный</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Привязка к проекту
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">Без привязки</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.number} — {order.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!subject.trim() || !description.trim() || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Отправить
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
