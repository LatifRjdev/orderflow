import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { ClientActions } from "@/components/clients/client-actions";
import { PortalAccess } from "@/components/clients/portal-access";
import { AddContactDialog } from "@/components/clients/add-contact-dialog";
import { EditContactDialog } from "@/components/clients/edit-contact-dialog";
import { ClientNotes } from "@/components/clients/client-notes";

const sourceLabels: Record<string, string> = {
  REFERRAL: "Рекомендация",
  WEBSITE: "Сайт",
  LINKEDIN: "LinkedIn",
  TELEGRAM: "Telegram",
  UPWORK: "Upwork",
  DIRECT: "Прямое обращение",
  OTHER: "Другое",
};

interface ClientPageProps {
  params: { id: string };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const [client, session] = await Promise.all([
    getClient(params.id),
    auth(),
  ]);
  const userRole = session?.user?.role || "";

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
            <div className="flex items-center gap-2 mt-2">
              {client.industry && (
                <Badge variant="outline">
                  {client.industry}
                </Badge>
              )}
              {client.source && (
                <Badge variant="secondary">
                  {sourceLabels[client.source] || client.source}
                </Badge>
              )}
              {client.currency && (
                <Badge variant="outline" className="font-mono">
                  {client.currency}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ClientActions clientId={client.id} isArchived={client.isArchived} userRole={userRole} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{client._count?.orders || 0}</p>
              <p className="text-sm text-muted-foreground">Заказов</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeOrders}</p>
              <p className="text-sm text-muted-foreground">Активных</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{client._count?.invoices || 0}</p>
              <p className="text-sm text-muted-foreground">Счетов</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#dbdfe6] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Выручка</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Info & Contacts */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Информация
              </h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
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
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Контактные лица
              </h3>
              <AddContactDialog clientId={client.id} />
            </div>
            <div className="px-6 pb-6">
              {client.contacts && client.contacts.length > 0 ? (
                <div className="space-y-4">
                  {client.contacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-[#dbdfe6] bg-background-light/30"
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
                          <div className="ml-auto">
                            <EditContactDialog clientId={client.id} contact={contact} />
                          </div>
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
            </div>
          </div>

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
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Заказы
              </h3>
              <Link href={`/orders?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  Все заказы
                </Button>
              </Link>
            </div>
            <div className="px-6 pb-6">
              {client.orders && client.orders.length > 0 ? (
                <div className="space-y-3">
                  {client.orders.map((order: any) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50 transition-colors"
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
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: order.status.color }} />
                            <span className="text-sm">{order.status.name}</span>
                          </div>
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
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Счета
              </h3>
              <Link href={`/finance?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  Все счета
                </Button>
              </Link>
            </div>
            <div className="px-6 pb-6">
              {client.invoices && client.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#dbdfe6]">
                        <th className="text-left py-2 font-medium">Номер</th>
                        <th className="text-left py-2 font-medium">Дата</th>
                        <th className="text-left py-2 font-medium">Статус</th>
                        <th className="text-right py-2 font-medium">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.invoices.map((invoice: any) => {
                        const statusMap: Record<string, { label: string; dot: string }> = {
                          DRAFT: { label: "Черновик", dot: "#9ca3af" },
                          SENT: { label: "Отправлен", dot: "#3b82f6" },
                          VIEWED: { label: "Просмотрен", dot: "#8b5cf6" },
                          PAID: { label: "Оплачен", dot: "#22c55e" },
                          PARTIALLY_PAID: { label: "Частично", dot: "#f59e0b" },
                          OVERDUE: { label: "Просрочен", dot: "#ef4444" },
                          CANCELLED: { label: "Отменён", dot: "#9ca3af" },
                        };
                        const statusInfo = statusMap[invoice.status] || { label: invoice.status, dot: "#9ca3af" };
                        return (
                          <tr key={invoice.id} className="border-b border-[#dbdfe6] last:border-0">
                            <td className="py-2 font-mono">{invoice.number}</td>
                            <td className="py-2">{formatDate(invoice.issueDate)}</td>
                            <td className="py-2">
                              <div className="inline-flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusInfo.dot }} />
                                <span className="text-sm">{statusInfo.label}</span>
                              </div>
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
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Документы
                </h3>
                <div className="flex gap-2">
                  <Link href={`/documents/contracts/new`}>
                    <Button variant="ghost" size="sm" className="text-xs">Договор</Button>
                  </Link>
                  <Link href={`/documents/reconciliations/new`}>
                    <Button variant="ghost" size="sm" className="text-xs">Акт сверки</Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {(client as any).contracts?.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/documents/contracts/${c.id}`}
                  className="flex items-center justify-between p-2 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Договор</p>
                    <p className="text-sm font-mono">{c.number}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.title}</span>
                </Link>
              ))}
              {(client as any).reconciliations?.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/documents/reconciliations/${r.id}`}
                  className="flex items-center justify-between p-2 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Акт сверки</p>
                    <p className="text-sm font-mono">{r.number}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.periodFrom)} — {formatDate(r.periodTo)}
                  </span>
                </Link>
              ))}
              {!(client as any).contracts?.length && !(client as any).reconciliations?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">Документов пока нет</p>
              )}
            </div>
          </div>

          {/* Client Notes */}
          <ClientNotes
            clientId={client.id}
            notes={(client.clientNotes || []) as any}
          />
        </div>
      </div>
    </div>
  );
}
