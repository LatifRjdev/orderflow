"use client";

import { Textarea } from "@/components/ui/textarea";

interface SectionTextProps {
  content: { text: string };
  onChange: (content: { text: string }) => void;
}

export function SectionText({ content, onChange }: SectionTextProps) {
  return (
    <Textarea
      rows={6}
      placeholder="Введите текст..."
      value={content.text || ""}
      onChange={(e) => onChange({ text: e.target.value })}
    />
  );
}
