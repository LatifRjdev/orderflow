import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FloatingTimer } from "./floating-timer";

export async function TimerProvider() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const orders = await prisma.order.findMany({
    where: {
      status: {
        isFinal: false,
      },
    },
    select: {
      id: true,
      number: true,
      title: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return <FloatingTimer orders={orders} userId={session.user.id} />;
}
