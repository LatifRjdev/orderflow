import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { logger } from "@/lib/logger";

const log = logger.create("Notification");

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  linkUrl?: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        linkUrl: params.linkUrl,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    });
  } catch (error) {
    log.error("Failed to create", error);
  }
}

export async function createNotificationForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        description: params.description,
        linkUrl: params.linkUrl,
        entityType: params.entityType,
        entityId: params.entityId,
      })),
    });
  } catch (error) {
    log.error("Failed to create for users", error);
  }
}

export async function getOrderNotificationRecipients(
  orderId: string
): Promise<string[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { managerId: true },
  });

  const adminsAndManagers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    select: { id: true },
  });

  const recipientIds = new Set<string>();
  if (order?.managerId) recipientIds.add(order.managerId);
  for (const user of adminsAndManagers) recipientIds.add(user.id);

  return Array.from(recipientIds);
}
