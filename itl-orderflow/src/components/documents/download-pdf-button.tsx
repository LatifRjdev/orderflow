"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface DownloadPdfButtonProps {
  type: "contract" | "tech-spec" | "amendment" | "reconciliation";
  id: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadPdfButton({
  type,
  id,
  variant = "outline",
  size = "sm",
  className,
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdf/${type}/${id}`);
      if (res.redirected) {
        window.open(res.url, "_blank");
      } else {
        const data = await res.json();
        if (data.error) console.error("PDF error:", data.error);
      }
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Скачать PDF
    </Button>
  );
}
