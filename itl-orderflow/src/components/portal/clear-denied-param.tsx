"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClearDeniedParam() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portal", { scroll: false });
  }, [router]);

  return null;
}
