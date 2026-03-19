"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateInvoicePdf } from "@/actions/pdf";

interface DownloadPdfButtonProps {
  invoiceId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadInvoicePdfButton({
  invoiceId,
  variant = "outline",
  size = "sm",
  className,
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const result = await generateInvoicePdf(invoiceId);
      if (result.url) {
        window.open(result.url, "_blank");
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
