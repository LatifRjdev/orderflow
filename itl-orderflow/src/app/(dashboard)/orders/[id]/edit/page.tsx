import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOrder, updateOrder } from "@/actions/orders";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

interface EditOrderPageProps {
  params: { id: string };
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const [order, clients, managers] = await Promise.all([
    getOrder(params.id),
    prisma.client.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await updateOrder(params.id, formData);
    if (result.success) {
      redirect(`/orders/${params.id}`);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/orders/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Редактирование заказа</h1>
          <p className="text-muted-foreground text-sm">
            {order.number} — {order.title}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Название *
              </label>
              <Input name="title" defaultValue={order.title} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Описание
              </label>
              <textarea
                name="description"
                defaultValue={order.description || ""}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Тип проекта
                </label>
                <Input
                  name="projectType"
                  defaultValue={order.projectType || ""}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Приоритет
                </label>
                <select
                  name="priority"
                  defaultValue={order.priority}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="LOW">Низкий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="HIGH">Высокий</option>
                  <option value="URGENT">Срочный</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Менеджер
                </label>
                <select
                  name="managerId"
                  defaultValue={order.managerId || ""}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Не назначен</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Дедлайн
                </label>
                <Input
                  name="deadline"
                  type="date"
                  defaultValue={
                    order.deadline
                      ? new Date(order.deadline).toISOString().split("T")[0]
                      : ""
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Оценка часов
                </label>
                <Input
                  name="estimatedHours"
                  type="number"
                  step="0.5"
                  defaultValue={
                    order.estimatedHours
                      ? Number(order.estimatedHours)
                      : ""
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Бюджет
                </label>
                <Input
                  name="estimatedBudget"
                  type="number"
                  step="0.01"
                  defaultValue={
                    order.estimatedBudget
                      ? Number(order.estimatedBudget)
                      : ""
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Валюта
                </label>
                <select
                  name="currency"
                  defaultValue={order.currency || "TJS"}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="TJS">TJS</option>
                  <option value="USD">USD</option>
                  <option value="RUB">RUB</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Сохранить</Button>
              <Link href={`/orders/${params.id}`}>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
