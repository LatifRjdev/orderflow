"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(255),
  legalName: z.string().max(255).optional(),
  inn: z.string().max(12).optional(),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  website: z.string().url("Некорректный URL").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const updateClientSchema = createClientSchema.partial();

// Get all clients
export async function getClients(params?: {
  search?: string;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { search, isArchived = false, limit = 20, offset = 0 } = params || {};

  const where = {
    isArchived,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { contacts: { some: { firstName: { contains: search, mode: "insensitive" as const } } } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total };
}

// Get single client
export async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: { isPrimary: "desc" },
      },
      orders: {
        include: {
          status: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { orders: true, invoices: true },
      },
    },
  });

  return client;
}

// Create client
export async function createClient(formData: FormData) {
  await requireAuth();
  const rawData = {
    name: formData.get("name") as string,
    legalName: formData.get("legalName") as string || undefined,
    inn: formData.get("inn") as string || undefined,
    email: formData.get("email") as string || undefined,
    phone: formData.get("phone") as string || undefined,
    website: formData.get("website") as string || undefined,
    address: formData.get("address") as string || undefined,
    industry: formData.get("industry") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const validated = createClientSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0].message,
    };
  }

  try {
    const client = await prisma.client.create({
      data: validated.data,
    });

    revalidatePath("/clients");
    return { success: true, client };
  } catch (error) {
    console.error("Error creating client:", error);
    return { error: "Ошибка при создании клиента" };
  }
}

// Update client
export async function updateClient(id: string, formData: FormData) {
  await requireAuth();
  const rawData = {
    name: formData.get("name") as string,
    legalName: formData.get("legalName") as string || undefined,
    inn: formData.get("inn") as string || undefined,
    email: formData.get("email") as string || undefined,
    phone: formData.get("phone") as string || undefined,
    website: formData.get("website") as string || undefined,
    address: formData.get("address") as string || undefined,
    industry: formData.get("industry") as string || undefined,
    notes: formData.get("notes") as string || undefined,
  };

  const validated = updateClientSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0].message,
    };
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { success: true, client };
  } catch (error) {
    console.error("Error updating client:", error);
    return { error: "Ошибка при обновлении клиента" };
  }
}

// Archive/unarchive client
export async function toggleClientArchive(id: string) {
  await requireAuth();
  try {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return { error: "Клиент не найден" };

    await prisma.client.update({
      where: { id },
      data: { isArchived: !client.isArchived },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Error archiving client:", error);
    return { error: "Ошибка при архивации клиента" };
  }
}

// Delete client (cascade: orders, invoices, proposals, contacts)
export async function deleteClient(id: string) {
  await requireRole(["ADMIN"]);
  try {
    await prisma.$transaction(async (tx) => {
      // Delete proposals (items/sections/payments cascade via schema)
      await tx.proposal.deleteMany({ where: { clientId: id } });
      // Delete invoices (items/payments cascade via schema)
      await tx.invoice.deleteMany({ where: { clientId: id } });
      // Delete orders (tasks/milestones/files/comments cascade via schema)
      await tx.order.deleteMany({ where: { clientId: id } });
      // Delete client (contacts cascade via schema)
      await tx.client.delete({ where: { id } });
    });
    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { error: "Ошибка при удалении клиента" };
  }
}

// Add contact
export async function addClientContact(
  clientId: string,
  data: {
    firstName: string;
    lastName?: string;
    position?: string;
    email?: string;
    phone?: string;
    telegram?: string;
    isPrimary?: boolean;
    isDecisionMaker?: boolean;
  }
) {
  await requireAuth();
  try {
    // If this contact is primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.clientContact.updateMany({
        where: { clientId },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.clientContact.create({
      data: {
        clientId,
        ...data,
      },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, contact };
  } catch (error) {
    console.error("Error adding contact:", error);
    return { error: "Ошибка при добавлении контакта" };
  }
}
