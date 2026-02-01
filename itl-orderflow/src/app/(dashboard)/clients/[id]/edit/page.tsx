import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getClient, updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

interface EditClientPageProps {
  params: { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const client = await getClient(params.id);

  if (!client) {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await updateClient(params.id, formData);
    if (result.success) {
      redirect(`/clients/${params.id}`);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Редактирование клиента</h1>
          <p className="text-muted-foreground text-sm">{client.name}</p>
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
                Название компании *
              </label>
              <Input name="name" defaultValue={client.name} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Юридическое наименование
              </label>
              <Input name="legalName" defaultValue={client.legalName || ""} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ИНН</label>
              <Input name="inn" defaultValue={client.inn || ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={client.email || ""}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Телефон
                </label>
                <Input name="phone" defaultValue={client.phone || ""} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Сайт</label>
              <Input name="website" defaultValue={client.website || ""} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Адрес</label>
              <Input name="address" defaultValue={client.address || ""} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Отрасль
              </label>
              <Input name="industry" defaultValue={client.industry || ""} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Заметки
              </label>
              <textarea
                name="notes"
                defaultValue={client.notes || ""}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Сохранить</Button>
              <Link href={`/clients/${params.id}`}>
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
