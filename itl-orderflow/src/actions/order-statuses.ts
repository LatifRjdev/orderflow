"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";

const statusSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100),
  code: z.string().min(1, "Код обязателен").max(50),
  color: z.string().default("#6B7280"),
  isInitial: z.boolean().default(false),
  isFinal: z.boolean().default(false),
  notifyClient: z.boolean().default(false),
});

// Get all statuses (including inactive)
export async function getAllOrderStatuses() {
  return prisma.orderStatus.findMany({
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { position: "asc" },
  });
}

// Create order status
export async function createOrderStatus(formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    color: formData.get("color") as string || "#6B7280",
    isInitial: formData.get("isInitial") === "true",
    isFinal: formData.get("isFinal") === "true",
    notifyClient: formData.get("notifyClient") === "true",
  };

  const validated = statusSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // Check code uniqueness
    const existing = await prisma.orderStatus.findUnique({
      where: { code: validated.data.code },
    });
    if (existing) {
      return { error: "Статус с таким кодом уже существует" };
    }

    // Get next position
    const last = await prisma.orderStatus.findFirst({
      orderBy: { position: "desc" },
    });

    // If this is initial, unset other initials
    if (validated.data.isInitial) {
      await prisma.orderStatus.updateMany({
        data: { isInitial: false },
      });
    }

    const status = await prisma.orderStatus.create({
      data: {
        ...validated.data,
        position: (last?.position || 0) + 1,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/orders");
    return { success: true, status };
  } catch (error) {
    console.error("Error creating status:", error);
    return { error: "Ошибка при создании статуса" };
  }
}

// Update order status
export async function updateOrderStatus(id: string, formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const data: Record<string, any> = {};

    const name = formData.get("name") as string;
    const color = formData.get("color") as string;
    const isInitial = formData.get("isInitial");
    const isFinal = formData.get("isFinal");
    const notifyClient = formData.get("notifyClient");
    const isActive = formData.get("isActive");

    if (name) data.name = name;
    if (color) data.color = color;
    if (isInitial !== null) data.isInitial = isInitial === "true";
    if (isFinal !== null) data.isFinal = isFinal === "true";
    if (notifyClient !== null) data.notifyClient = notifyClient === "true";
    if (isActive !== null) data.isActive = isActive === "true";

    // If setting as initial, unset others
    if (data.isInitial) {
      await prisma.orderStatus.updateMany({
        where: { NOT: { id } },
        data: { isInitial: false },
      });
    }

    const status = await prisma.orderStatus.update({
      where: { id },
      data,
    });

    revalidatePath("/settings");
    revalidatePath("/orders");
    return { success: true, status };
  } catch (error) {
    console.error("Error updating status:", error);
    return { error: "Ошибка при обновлении статуса" };
  }
}

// Delete order status (only if no orders use it)
export async function deleteOrderStatus(id: string) {
  await requireRole(["ADMIN"]);

  try {
    const status = await prisma.orderStatus.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!status) return { error: "Статус не найден" };

    if (status._count.orders > 0) {
      return { error: `Невозможно удалить: ${status._count.orders} заказов используют этот статус` };
    }

    await prisma.orderStatus.delete({ where: { id } });

    revalidatePath("/settings");
    revalidatePath("/orders");
    return { success: true };
  } catch (error) {
    console.error("Error deleting status:", error);
    return { error: "Ошибка при удалении статуса" };
  }
}

// Reorder statuses
export async function reorderStatuses(orderedIds: string[]) {
  await requireRole(["ADMIN"]);

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.orderStatus.update({
          where: { id },
          data: { position: index + 1 },
        })
      )
    );

    revalidatePath("/settings");
    revalidatePath("/orders");
    return { success: true };
  } catch (error) {
    console.error("Error reordering statuses:", error);
    return { error: "Ошибка при изменении порядка" };
  }
}
