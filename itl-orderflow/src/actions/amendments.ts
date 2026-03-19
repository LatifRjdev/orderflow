"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { AmendmentStatus } from "@prisma/client";

const createAmendmentSchema = z.object({
  title: z.string().min(1),
  contractId: z.string().min(1),
  effectiveDate: z.string().min(1),
  description: z.string().min(1),
  changes: z.any(),
});

export async function getAmendments(params?: {
  search?: string;
  status?: string;
  contractId?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, status, contractId, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(status && { status }),
    ...(contractId && { contractId }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
        { contract: { title: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [amendments, total] = await Promise.all([
    prisma.amendment.findMany({
      where,
      include: {
        contract: {
          select: { id: true, number: true, title: true, client: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.amendment.count({ where }),
  ]);

  return { amendments, total };
}

export async function getAmendment(id: string) {
  return prisma.amendment.findUnique({
    where: { id },
    include: {
      contract: {
        include: {
          client: true,
          order: { select: { id: true, title: true, number: true } },
        },
      },
    },
  });
}

export async function createAmendment(data: z.infer<typeof createAmendmentSchema>) {
  await requireAuth();
  const validated = createAmendmentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  // Verify contract exists
  const contract = await prisma.contract.findUnique({
    where: { id: validated.data.contractId },
  });
  if (!contract) {
    return { error: "Договор не найден" };
  }

  try {
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextAmendmentNumber: { increment: 1 } },
    });
    const amendmentNumber = `${settings.amendmentPrefix}-${new Date().getFullYear()}-${String(
      settings.nextAmendmentNumber - 1
    ).padStart(3, "0")}`;

    const amendment = await prisma.amendment.create({
      data: {
        number: amendmentNumber,
        title: validated.data.title,
        contractId: validated.data.contractId,
        effectiveDate: new Date(validated.data.effectiveDate),
        description: validated.data.description,
        changes: validated.data.changes,
      },
    });

    revalidatePath("/documents");
    return { success: true, id: amendment.id };
  } catch (error) {
    return { error: "Ошибка при создании доп. соглашения" };
  }
}

export async function updateAmendment(
  id: string,
  data: Partial<z.infer<typeof createAmendmentSchema>>
) {
  await requireAuth();

  try {
    await prisma.amendment.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.effectiveDate && { effectiveDate: new Date(data.effectiveDate) }),
        ...(data.description && { description: data.description }),
        ...(data.changes !== undefined && { changes: data.changes }),
      },
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/amendments/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении доп. соглашения" };
  }
}

export async function updateAmendmentStatus(id: string, status: AmendmentStatus) {
  await requireAuth();

  try {
    await prisma.amendment.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/amendments/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении статуса" };
  }
}

export async function deleteAmendment(id: string) {
  await requireRole(["ADMIN", "MANAGER"]);

  try {
    await prisma.amendment.delete({ where: { id } });
    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при удалении доп. соглашения" };
  }
}
