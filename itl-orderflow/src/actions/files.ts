"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";

interface UploadedFile {
  name: string;
  url: string;
  key: string;
  size: number;
  type?: string;
}

// Save uploaded files to DB
export async function saveOrderFiles(
  orderId: string,
  files: UploadedFile[],
  options?: { category?: string; isClientVisible?: boolean; milestoneId?: string }
) {
  try {
    const session = await requireAuth();

    const created = await prisma.file.createMany({
      data: files.map((file) => ({
        orderId,
        milestoneId: options?.milestoneId || null,
        name: file.name.replace(/\.[^/.]+$/, ""),
        originalName: file.name,
        url: file.url,
        key: file.key,
        size: file.size,
        mimeType: file.type || null,
        category: options?.category || null,
        isClientVisible: options?.isClientVisible ?? false,
        uploadedById: session?.user?.id || null,
      })),
    });

    revalidatePath(`/orders/${orderId}`);
    return { success: true, count: created.count };
  } catch (error) {
    console.error("Error saving files:", error);
    return { error: "Ошибка при сохранении файлов" };
  }
}

// Get files for an order
export async function getOrderFiles(orderId: string) {
  const files = await prisma.file.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  return files;
}

// Delete a file
export async function deleteFile(id: string) {
  try {
    await requireAuth();
    const file = await prisma.file.delete({ where: { id } });

    if (file.orderId) {
      revalidatePath(`/orders/${file.orderId}`);
    }

    return { success: true, key: file.key };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { error: "Ошибка при удалении файла" };
  }
}

// Toggle file client downloadable
export async function toggleFileDownloadable(id: string) {
  try {
    await requireAuth();
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return { error: "Файл не найден" };

    await prisma.file.update({
      where: { id },
      data: { isClientDownloadable: !file.isClientDownloadable },
    });

    if (file.orderId) {
      revalidatePath(`/orders/${file.orderId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling file downloadable:", error);
    return { error: "Ошибка" };
  }
}

// Toggle file client visibility
export async function toggleFileVisibility(id: string) {
  try {
    await requireAuth();
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return { error: "Файл не найден" };

    await prisma.file.update({
      where: { id },
      data: { isClientVisible: !file.isClientVisible },
    });

    if (file.orderId) {
      revalidatePath(`/orders/${file.orderId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling file visibility:", error);
    return { error: "Ошибка" };
  }
}
