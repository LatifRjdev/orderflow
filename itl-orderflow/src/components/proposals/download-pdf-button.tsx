"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateProposalPdf } from "@/actions/pdf";

interface DownloadProposalPdfButtonProps {
  proposalId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadProposalPdfButton({
  proposalId,
  variant = "outline",
  size = "sm",
  className,
}: DownloadProposalPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const result = await generateProposalPdf(proposalId);
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
