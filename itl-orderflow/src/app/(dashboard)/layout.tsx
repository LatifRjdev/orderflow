import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TimerProvider } from "@/components/timer/timer-provider";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let user: { name?: string | null; email?: string | null; role?: string; image?: string | null } | undefined;

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    });
    user = {
      name: dbUser?.name ?? session.user.name,
      email: session.user.email,
      role: session.user.role,
      image: dbUser?.image,
    };
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Suspense fallback={null}>
        <TimerProvider />
      </Suspense>
      <Toaster />
    </div>
  );
}
