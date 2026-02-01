"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export interface SearchResult {
  id: string;
  type: "order" | "client" | "task";
  title: string;
  subtitle?: string;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireAuth();
  if (!query || query.length < 2) return [];

  const q = query.trim();

  const [orders, clients, tasks] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { number: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        number: true,
        client: { select: { name: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        isArchived: false,
      },
      select: { id: true, name: true, industry: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        order: { select: { number: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: SearchResult[] = [];

  for (const o of orders) {
    results.push({
      id: o.id,
      type: "order",
      title: `${o.number} — ${o.title}`,
      subtitle: o.client?.name,
      href: `/orders/${o.id}`,
    });
  }

  for (const c of clients) {
    results.push({
      id: c.id,
      type: "client",
      title: c.name,
      subtitle: c.industry || undefined,
      href: `/clients/${c.id}`,
    });
  }

  for (const t of tasks) {
    results.push({
      id: t.id,
      type: "task",
      title: t.title,
      subtitle: t.order?.number || undefined,
      href: `/tasks/${t.id}`,
    });
  }

  return results;
}
