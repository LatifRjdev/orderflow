import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowLeft,
  FileText,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  User,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { ClientActions } from "@/components/clients/client-actions";
import { PortalAccess } from "@/components/clients/portal-access";

interface ClientPageProps {
  params: { id: string };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const client = await getClient(params.id);

  if (!client) {
    notFound();
  }

  const primaryContact = client.contacts?.find((c) => c.isPrimary);

  // Calculate total revenue from paid invoices
  const totalRevenue = client.invoices
    ?.filter((inv: any) => inv.status === "PAID")
    .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0;

  const activeOrders = client.orders?.filter(
    (o: any) => !["completed", "cancelled"].includes(o.status?.code || "")
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              {client.isArchived && (
                <Badge variant="secondary">Архив</Badge>
              )}
            </div>
            {client.legalName && (
              <p className="text-muted-foreground mt-1">{client.legalName}</p>
            )}
            {client.industry && (
              <Badge variant="outline" className="mt-2">
                {client.industry}
              </Badge>
            )}
          </div>
        </div>
        <ClientActions clientId={client.id} isArchived={client.isArchived} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{client._count?.orders || 0}</p>
                <p className="text-sm text-muted-foreground">Заказов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeOrders}</p>
                <p className="text-sm text-muted-foreground">Активных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{client._count?.invoices || 0}</p>
                <p className="text-sm text-muted-foreground">Счетов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">Выручка</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Info & Contacts */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.inn && (
                <div>
                  <p className="text-sm text-muted-foreground">ИНН</p>
                  <p className="font-medium">{client.inn}</p>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${client.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${client.phone}`}
                    className="hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{client.address}</span>
                </div>
              )}
              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Заметки</p>
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>Создан: {formatDate(client.createdAt)}</p>
                <p>Обновлён: {formatRelativeTime(client.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Контактные лица
              </CardTitle>
              <Button variant="outline" size="sm">
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {client.contacts && client.contacts.length > 0 ? (
                <div className="space-y-4">
                  {client.contacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="p-2 bg-muted rounded-full">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                              Основной
                            </Badge>
                          )}
                          {contact.isDecisionMaker && (
                            <Badge variant="outline" className="text-xs">
                              ЛПР
                            </Badge>
                          )}
                        </div>
                        {contact.position && (
                          <p className="text-sm text-muted-foreground">
                            {contact.position}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <span className="text-muted-foreground">
                              {contact.phone}
                            </span>
                          )}
                          {contact.telegram && (
                            <span className="text-muted-foreground">
                              @{contact.telegram}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Контактные лица не добавлены
                </p>
              )}
            </CardContent>
          </Card>

          {/* Portal Access */}
          <PortalAccess
            clientId={client.id}
            portalToken={client.portalToken}
            portalEnabled={client.portalEnabled}
          />
        </div>

        {/* Right Column - Orders & Invoices */}
        <div className="col-span-2 space-y-6">
          {/* Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Заказы
              </CardTitle>
              <Link href={`/orders?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  Все заказы
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.orders && client.orders.length > 0 ? (
                <div className="space-y-3">
                  {client.orders.map((order: any) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground">
                            {order.number}
                          </span>
                          <span className="font-medium truncate">
                            {order.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {order.deadline && (
                            <span>Дедлайн: {formatDate(order.deadline)}</span>
                          )}
                          {order.estimatedBudget && (
                            <span>
                              {formatCurrency(order.estimatedBudget, order.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={order.priority === "URGENT" ? "destructive" : order.priority === "HIGH" ? "warning" : "secondary"}
                        >
                          {order.priority === "LOW" && "Низкий"}
                          {order.priority === "MEDIUM" && "Средний"}
                          {order.priority === "HIGH" && "Высокий"}
                          {order.priority === "URGENT" && "Срочный"}
                        </Badge>
                        {order.status && (
                          <Badge
                            style={{
                              backgroundColor: order.status.color + "20",
                              color: order.status.color,
                              borderColor: order.status.color,
                            }}
                            variant="outline"
                          >
                            {order.status.name}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Заказов пока нет</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Счета
              </CardTitle>
              <Link href={`/finance?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  Все счета
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.invoices && client.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Номер</th>
                        <th className="text-left py-2 font-medium">Дата</th>
                        <th className="text-left py-2 font-medium">Статус</th>
                        <th className="text-right py-2 font-medium">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.invoices.map((invoice: any) => {
                        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
                          DRAFT: { label: "Черновик", variant: "secondary" },
                          SENT: { label: "Отправлен", variant: "default" },
                          VIEWED: { label: "Просмотрен", variant: "default" },
                          PAID: { label: "Оплачен", variant: "success" },
                          PARTIALLY_PAID: { label: "Частично", variant: "warning" },
                          OVERDUE: { label: "Просрочен", variant: "destructive" },
                          CANCELLED: { label: "Отменён", variant: "secondary" },
                        };
                        const statusInfo = statusMap[invoice.status] || { label: invoice.status, variant: "secondary" as const };
                        return (
                          <tr key={invoice.id} className="border-b last:border-0">
                            <td className="py-2 font-mono">{invoice.number}</td>
                            <td className="py-2">{formatDate(invoice.issueDate)}</td>
                            <td className="py-2">
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="py-2 text-right font-medium">
                              {formatCurrency(Number(invoice.total), invoice.currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Счетов пока нет</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
