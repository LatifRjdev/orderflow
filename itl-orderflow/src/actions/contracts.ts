"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { ContractStatus, ContractSectionType } from "@prisma/client";

const contractSectionSchema = z.object({
  type: z.nativeEnum(ContractSectionType),
  title: z.string().min(1),
  content: z.any(),
  position: z.number(),
});

const createContractSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().min(1),
  orderId: z.string().optional().nullable(),
  contractDate: z.string().min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  totalAmount: z.coerce.number().min(0).default(0),
  currency: z.string().default("TJS"),
});

export async function getContracts(params?: {
  search?: string;
  status?: string;
  clientId?: string;
  orderId?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, status, clientId, orderId, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(orderId && { orderId }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        order: { select: { id: true, title: true, number: true } },
        _count: { select: { amendments: true, sections: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.contract.count({ where }),
  ]);

  return { contracts, total };
}

export async function getContract(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      sections: { orderBy: { position: "asc" } },
      amendments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contract) return null;

  return {
    ...contract,
    totalAmount: Number(contract.totalAmount),
  };
}

export async function createContract(
  data: z.infer<typeof createContractSchema>,
  sections: z.infer<typeof contractSectionSchema>[]
) {
  await requireAuth();
  const validated = createContractSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextContractNumber: { increment: 1 } },
    });
    const contractNumber = `${settings.contractPrefix}-${new Date().getFullYear()}-${String(
      settings.nextContractNumber - 1
    ).padStart(3, "0")}`;

    const contract = await prisma.contract.create({
      data: {
        number: contractNumber,
        title: validated.data.title,
        clientId: validated.data.clientId,
        orderId: validated.data.orderId || null,
        contractDate: new Date(validated.data.contractDate),
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
        totalAmount: validated.data.totalAmount,
        currency: validated.data.currency,
        sections: {
          create: sections.map((s, i) => ({
            type: s.type,
            title: s.title,
            content: s.content,
            position: i,
          })),
        },
      },
    });

    revalidatePath("/documents");
    return { success: true, id: contract.id };
  } catch (error) {
    return { error: "Ошибка при создании договора" };
  }
}

export async function updateContract(
  id: string,
  data: Partial<z.infer<typeof createContractSchema>>,
  sections?: z.infer<typeof contractSectionSchema>[]
) {
  await requireAuth();

  try {
    await prisma.contract.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.orderId !== undefined && { orderId: data.orderId || null }),
        ...(data.contractDate && { contractDate: new Date(data.contractDate) }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.currency && { currency: data.currency }),
      },
    });

    if (sections) {
      await prisma.contractSection.deleteMany({ where: { contractId: id } });
      await prisma.contractSection.createMany({
        data: sections.map((s, i) => ({
          contractId: id,
          type: s.type,
          title: s.title,
          content: s.content,
          position: i,
        })),
      });
    }

    revalidatePath("/documents");
    revalidatePath(`/documents/contracts/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении договора" };
  }
}

export async function updateContractStatus(id: string, status: ContractStatus) {
  await requireAuth();

  try {
    await prisma.contract.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/contracts/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении статуса" };
  }
}

export async function deleteContract(id: string) {
  await requireRole(["ADMIN", "MANAGER"]);

  try {
    await prisma.contract.delete({ where: { id } });
    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при удалении договора" };
  }
}
