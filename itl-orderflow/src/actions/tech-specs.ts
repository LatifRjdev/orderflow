"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { TechSpecStatus, TechSpecSectionType } from "@prisma/client";

const techSpecSectionSchema = z.object({
  type: z.nativeEnum(TechSpecSectionType),
  title: z.string().min(1),
  content: z.any(),
  position: z.number(),
});

const createTechSpecSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().min(1),
  orderId: z.string().optional().nullable(),
  version: z.string().default("1.0"),
});

export async function getTechSpecs(params?: {
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

  const [specs, total] = await Promise.all([
    prisma.techSpec.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        order: { select: { id: true, title: true, number: true } },
        _count: { select: { sections: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.techSpec.count({ where }),
  ]);

  return { specs, total };
}

export async function getTechSpec(id: string) {
  return prisma.techSpec.findUnique({
    where: { id },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      sections: { orderBy: { position: "asc" } },
    },
  });
}

export async function createTechSpec(
  data: z.infer<typeof createTechSpecSchema>,
  sections: z.infer<typeof techSpecSectionSchema>[]
) {
  await requireAuth();
  const validated = createTechSpecSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextSpecNumber: { increment: 1 } },
    });
    const specNumber = `${settings.specPrefix}-${new Date().getFullYear()}-${String(
      settings.nextSpecNumber - 1
    ).padStart(3, "0")}`;

    const spec = await prisma.techSpec.create({
      data: {
        number: specNumber,
        title: validated.data.title,
        clientId: validated.data.clientId,
        orderId: validated.data.orderId || null,
        version: validated.data.version,
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
    return { success: true, id: spec.id };
  } catch (error) {
    return { error: "Ошибка при создании ТЗ" };
  }
}

export async function updateTechSpec(
  id: string,
  data: Partial<z.infer<typeof createTechSpecSchema>>,
  sections?: z.infer<typeof techSpecSectionSchema>[]
) {
  await requireAuth();

  try {
    await prisma.techSpec.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.orderId !== undefined && { orderId: data.orderId || null }),
        ...(data.version && { version: data.version }),
      },
    });

    if (sections) {
      await prisma.techSpecSection.deleteMany({ where: { techSpecId: id } });
      await prisma.techSpecSection.createMany({
        data: sections.map((s, i) => ({
          techSpecId: id,
          type: s.type,
          title: s.title,
          content: s.content,
          position: i,
        })),
      });
    }

    revalidatePath("/documents");
    revalidatePath(`/documents/specs/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении ТЗ" };
  }
}

export async function updateTechSpecStatus(id: string, status: TechSpecStatus) {
  await requireAuth();

  try {
    await prisma.techSpec.update({
      where: { id },
      data: {
        status,
        ...(status === "APPROVED" && { approvedDate: new Date() }),
      },
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/specs/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении статуса" };
  }
}

export async function deleteTechSpec(id: string) {
  await requireRole(["ADMIN", "MANAGER"]);

  try {
    await prisma.techSpec.delete({ where: { id } });
    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при удалении ТЗ" };
  }
}
