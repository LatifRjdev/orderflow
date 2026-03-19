"use client";

import { Textarea } from "@/components/ui/textarea";

interface SpecSectionTextProps {
  content: { text: string };
  onChange: (content: { text: string }) => void;
}

export function SpecSectionText({ content, onChange }: SpecSectionTextProps) {
  return (
    <Textarea
      rows={6}
      placeholder="Введите текст..."
      value={content.text || ""}
      onChange={(e) => onChange({ text: e.target.value })}
    />
  );
}
