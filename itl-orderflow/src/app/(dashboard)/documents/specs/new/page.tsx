import { prisma } from "@/lib/prisma";
import { TechSpecForm } from "@/components/documents/tech-spec-form";

export default async function NewTechSpecPage() {
  const [clients, orders] = await Promise.all([
    prisma.client.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      select: { id: true, title: true, number: true, clientId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <TechSpecForm clients={clients} orders={orders} />;
}
