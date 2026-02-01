"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";

const proposalItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

// Get proposals list
export async function getProposals(params?: {
  search?: string;
  status?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, status, clientId, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [proposals, total, stats] = await Promise.all([
    prisma.proposal.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        order: { select: { id: true, title: true, number: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.proposal.count({ where }),
    prisma.proposal.groupBy({
      by: ["status"],
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  const statusStats = {
    total: 0,
    sent: 0,
    viewed: 0,
    accepted: 0,
    rejected: 0,
    totalAmount: 0,
    acceptedAmount: 0,
  };

  for (const s of stats) {
    const count = s._count;
    const amount = Number(s._sum.totalAmount || 0);
    statusStats.total += count;
    statusStats.totalAmount += amount;
    if (s.status === "SENT") statusStats.sent += count;
    if (s.status === "VIEWED") statusStats.viewed += count;
    if (s.status === "ACCEPTED") {
      statusStats.accepted += count;
      statusStats.acceptedAmount += amount;
    }
    if (s.status === "REJECTED") statusStats.rejected += count;
  }

  return {
    proposals: proposals.map((p) => ({
      ...p,
      totalAmount: Number(p.totalAmount),
    })),
    total,
    stats: statusStats,
  };
}

// Get single proposal
export async function getProposal(id: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      items: { orderBy: { position: "asc" } },
      sections: { orderBy: { position: "asc" } },
      payments: { orderBy: { position: "asc" } },
    },
  });

  if (!proposal) return null;

  return {
    ...proposal,
    totalAmount: Number(proposal.totalAmount),
    items: proposal.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
    payments: proposal.payments.map((p) => ({
      ...p,
      percentage: Number(p.percentage),
      amount: Number(p.amount),
    })),
  };
}

// Create proposal
export async function createProposal(
  data: {
    title: string;
    clientId: string;
    orderId?: string;
    validUntil?: string;
    currency?: string;
    introduction?: string;
    scope?: string;
  },
  items: z.infer<typeof proposalItemSchema>[],
  sections?: { type: string; title: string; content: any; position: number; isVisible: boolean }[],
  payments?: { stageName: string; percentage: number; amount: number; description?: string; position: number }[]
) {
  await requireAuth();
  try {
    const count = await prisma.proposal.count();
    const proposalNumber = `KP-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const proposal = await prisma.proposal.create({
      data: {
        number: proposalNumber,
        title: data.title,
        clientId: data.clientId,
        orderId: data.orderId || undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        currency: data.currency || "TJS",
        introduction: data.introduction,
        scope: data.scope,
        totalAmount,
        status: "DRAFT",
        items: {
          create: items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            position: idx,
          })),
        },
        ...(sections && sections.length > 0
          ? {
              sections: {
                create: sections.map((s) => ({
                  type: s.type as any,
                  title: s.title,
                  content: s.content,
                  position: s.position,
                  isVisible: s.isVisible,
                })),
              },
            }
          : {}),
        ...(payments && payments.length > 0
          ? {
              payments: {
                create: payments.map((p) => ({
                  stageName: p.stageName,
                  percentage: p.percentage,
                  amount: p.amount,
                  description: p.description,
                  position: p.position,
                })),
              },
            }
          : {}),
      },
    });

    revalidatePath("/proposals");
    return { success: true, proposal };
  } catch (error) {
    console.error("Error creating proposal:", error);
    return { error: "Ошибка при создании КП" };
  }
}

// Update proposal
export async function updateProposal(
  id: string,
  data: {
    title?: string;
    validUntil?: string;
    introduction?: string;
    scope?: string;
  },
  items?: z.infer<typeof proposalItemSchema>[],
  sections?: { type: string; title: string; content: any; position: number; isVisible: boolean }[],
  payments?: { stageName: string; percentage: number; amount: number; description?: string; position: number }[]
) {
  await requireAuth();
  try {
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
    if (data.introduction !== undefined) updateData.introduction = data.introduction || null;
    if (data.scope !== undefined) updateData.scope = data.scope || null;

    if (items) {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      updateData.totalAmount = totalAmount;

      await prisma.proposalItem.deleteMany({ where: { proposalId: id } });
      await prisma.proposalItem.createMany({
        data: items.map((item, idx) => ({
          proposalId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          position: idx,
        })),
      });
    }

    if (sections !== undefined) {
      await prisma.proposalSection.deleteMany({ where: { proposalId: id } });
      if (sections.length > 0) {
        await prisma.proposalSection.createMany({
          data: sections.map((s) => ({
            proposalId: id,
            type: s.type as any,
            title: s.title,
            content: s.content,
            position: s.position,
            isVisible: s.isVisible,
          })),
        });
      }
    }

    if (payments !== undefined) {
      await prisma.proposalPayment.deleteMany({ where: { proposalId: id } });
      if (payments.length > 0) {
        await prisma.proposalPayment.createMany({
          data: payments.map((p) => ({
            proposalId: id,
            stageName: p.stageName,
            percentage: p.percentage,
            amount: p.amount,
            description: p.description,
            position: p.position,
          })),
        });
      }
    }

    await prisma.proposal.update({ where: { id }, data: updateData });

    revalidatePath("/proposals");
    revalidatePath(`/proposals/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating proposal:", error);
    return { error: "Ошибка при обновлении КП" };
  }
}

// Update proposal status
export async function updateProposalStatus(id: string, status: string) {
  await requireAuth();
  try {
    const updateData: any = { status };

    if (status === "SENT") updateData.sentAt = new Date();
    if (status === "VIEWED") updateData.viewedAt = new Date();
    if (status === "ACCEPTED" || status === "REJECTED") {
      updateData.respondedAt = new Date();
    }

    await prisma.proposal.update({ where: { id }, data: updateData });

    revalidatePath("/proposals");
    revalidatePath(`/proposals/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating proposal status:", error);
    return { error: "Ошибка при обновлении статуса" };
  }
}

// Delete proposal
export async function deleteProposal(id: string) {
  await requireRole(["ADMIN"]);
  try {
    await prisma.proposal.delete({ where: { id } });
    revalidatePath("/proposals");
    return { success: true };
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return { error: "Ошибка при удалении КП" };
  }
}
