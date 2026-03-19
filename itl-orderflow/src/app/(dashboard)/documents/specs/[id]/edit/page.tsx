import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTechSpec } from "@/actions/tech-specs";
import { TechSpecEditor } from "@/components/documents/tech-spec-editor";

export default async function EditTechSpecPage({ params }: { params: { id: string } }) {
  const spec = await getTechSpec(params.id);
  if (!spec) notFound();

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

  return (
    <TechSpecEditor
      mode="edit"
      clients={clients}
      orders={orders}
      techSpec={{
        id: spec.id,
        title: spec.title,
        clientId: spec.clientId,
        orderId: spec.orderId || undefined,
        version: spec.version,
        sections: spec.sections?.map((s: any) => ({
          type: s.type,
          title: s.title,
          content: s.content,
          position: s.position,
        })),
      }}
    />
  );
}
