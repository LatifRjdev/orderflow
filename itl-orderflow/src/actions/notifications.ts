"use server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const log = logger.create("Notifications");
import { auth } from "@/lib/auth";
import {
  sendEmail,
  invoiceSentEmail,
  orderStatusEmail,
  milestoneReadyEmail,
  portalTokenEmail,
} from "@/lib/email";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return url;
}

// Send invoice to client via email
export async function sendInvoiceNotification(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        order: true,
      },
    });

    if (!invoice || !invoice.client?.email) {
      return { error: "Счёт или email клиента не найден" };
    }

    const { subject, html } = invoiceSentEmail({
      clientName: invoice.client.name,
      invoiceNumber: invoice.number,
      amount: `${Number(invoice.total)} ${invoice.currency}`,
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("ru-RU")
        : "Не указан",
      portalUrl: invoice.client.portalToken
        ? `${getBaseUrl()}/portal/login?token=${invoice.client.portalToken}`
        : undefined,
    });

    const result = await sendEmail({
      to: invoice.client.email,
      subject,
      html,
    });

    if (result.error) return { error: result.error };

    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    });

    return { success: true };
  } catch (error) {
    log.error("Error sending invoice notification", error);
    return { error: "Ошибка при отправке" };
  }
}

// Notify client about order status change
export async function sendOrderStatusNotification(
  orderId: string,
  newStatusName: string
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        status: true,
      },
    });

    if (!order || !order.client?.email) return;
    if (!order.status?.notifyClient) return;

    const { subject, html } = orderStatusEmail({
      clientName: order.client.name,
      orderNumber: order.number,
      orderTitle: order.title,
      newStatus: newStatusName,
      portalUrl: order.client.portalToken
        ? `${getBaseUrl()}/portal/login?token=${order.client.portalToken}`
        : undefined,
    });

    await sendEmail({ to: order.client.email, subject, html });
  } catch (error) {
    log.error("Error sending order status notification", error);
  }
}

// Notify client about milestone ready for approval
export async function sendMilestoneReadyNotification(milestoneId: string) {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        order: {
          include: { client: true },
        },
      },
    });

    if (!milestone || !milestone.order?.client?.email) return;

    const client = milestone.order.client;

    const { subject, html } = milestoneReadyEmail({
      clientName: client.name,
      orderNumber: milestone.order.number,
      milestoneTitle: milestone.title,
      portalUrl: client.portalToken
        ? `${getBaseUrl()}/portal/orders/${milestone.orderId}`
        : undefined,
    });

    await sendEmail({ to: client.email || "", subject, html });
  } catch (error) {
    log.error("Error sending milestone notification", error);
  }
}

// Send portal access link to client
export async function sendPortalAccessEmail(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client?.email || !client.portalToken) {
      return { error: "Email или токен клиента не найден" };
    }

    const { subject, html } = portalTokenEmail({
      clientName: client.name,
      portalUrl: `${getBaseUrl()}/portal/login?token=${client.portalToken}`,
    });

    const result = await sendEmail({ to: client.email, subject, html });

    if (result.error) return { error: result.error };
    return { success: true };
  } catch (error) {
    log.error("Error sending portal access email", error);
    return { error: "Ошибка при отправке" };
  }
}

// ==================== IN-APP NOTIFICATIONS ====================

// Fetch notifications for the current user
export async function getNotifications(params?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 };

  const { unreadOnly = false, limit = 30 } = params || {};

  const where: any = { userId: session.user.id };
  if (unreadOnly) where.read = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return { notifications, unreadCount };
}

// Get unread count only (lightweight for polling)
export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });
}

// Mark single notification as read
export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true, readAt: new Date() },
  });

  return { success: true };
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });

  return { success: true };
}
