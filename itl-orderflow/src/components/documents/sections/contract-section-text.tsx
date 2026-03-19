"use client";

import { Textarea } from "@/components/ui/textarea";

interface ContractSectionTextProps {
  content: { text: string };
  onChange: (content: { text: string }) => void;
}

export function ContractSectionText({ content, onChange }: ContractSectionTextProps) {
  return (
    <Textarea
      rows={6}
      placeholder="Введите текст..."
      value={content.text || ""}
      onChange={(e) => onChange({ text: e.target.value })}
    />
  );
}
