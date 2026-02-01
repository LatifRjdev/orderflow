import { Suspense } from "react";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { getClients } from "@/actions/clients";
import { formatDate } from "@/lib/utils";

interface ClientsSearchParams {
  search?: string;
  tab?: string;
}

async function ClientsTable({ search, tab }: ClientsSearchParams) {
  const isArchived = tab === "archive";
  const { clients, total } = await getClients({ search, isArchived });

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-semibold mb-1">Нет клиентов</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {search
              ? "По вашему запросу ничего не найдено"
              : isArchived
              ? "Архив пуст"
              : "Добавьте первого клиента, чтобы начать работу"}
          </p>
          {!search && !isArchived && <CreateClientDialog />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Компания</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Контакт</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden lg:table-cell">Телефон</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-muted-foreground">Проектов</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground hidden xl:table-cell">Добавлен</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const primaryContact = client.contacts[0];
                return (
                  <tr key={client.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <Link href={`/clients/${client.id}`}>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-primary/10">
                            <AvatarFallback className="text-primary text-sm">
                              {client.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            {client.industry && (
                              <span className="text-xs text-muted-foreground">{client.industry}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      {primaryContact ? (
                        <div>
                          <div className="font-medium text-sm">{primaryContact.firstName} {primaryContact.lastName}</div>
                          {primaryContact.position && <div className="text-xs text-muted-foreground">{primaryContact.position}</div>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      {client.email ? (
                        <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />{client.email}
                        </a>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      {client.phone ? (
                        <a href={`tel:${client.phone}`} className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />{client.phone}
                        </a>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary">{client._count.orders}</Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground hidden xl:table-cell">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-sm text-muted-foreground">Показано {clients.length} из {total}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientsTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: ClientsSearchParams;
}) {
  const search = searchParams.search;
  const tab = searchParams.tab || "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Клиенты</h1>
          <p className="text-muted-foreground text-sm">Управление клиентами компании</p>
        </div>
        <CreateClientDialog />
      </div>

      <Card>
        <CardContent className="p-4">
          <form action="/clients" method="GET" className="flex flex-col sm:flex-row gap-4">
            <div className="flex border rounded-lg overflow-hidden text-sm flex-shrink-0">
              <Link
                href={{ pathname: "/clients", query: { search, tab: "active" } }}
                className={`px-4 py-2 ${tab === "active" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                Активные
              </Link>
              <Link
                href={{ pathname: "/clients", query: { search, tab: "archive" } }}
                className={`px-4 py-2 ${tab === "archive" ? "bg-primary text-white" : "hover:bg-gray-100"}`}
              >
                Архив
              </Link>
            </div>

            <input type="hidden" name="tab" value={tab} />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input name="search" placeholder="Поиск по названию или контакту..." className="pl-9" defaultValue={search} />
            </div>
            <Button type="submit" variant="secondary">Найти</Button>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTable search={search} tab={tab} />
      </Suspense>
    </div>
  );
}
