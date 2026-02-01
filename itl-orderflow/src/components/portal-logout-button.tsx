"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PortalLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/portal/auth", { method: "DELETE" });
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout}>
      <LogOut className="w-4 h-4" />
    </Button>
  );
}
