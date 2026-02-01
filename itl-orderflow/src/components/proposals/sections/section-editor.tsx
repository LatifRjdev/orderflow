"use client";

import { ProposalSectionType } from "@prisma/client";
import type { SectionDraft, PaymentDraft, SectionContent, TechStackContent, KeyAdvantagesContent, FunctionalModulesContent, ImplementationStagesContent, ContactInfoContent } from "@/types/proposal-sections";
import { SectionText } from "./section-text";
import { SectionList } from "./section-list";
import { SectionModules } from "./section-modules";
import { SectionStages } from "./section-stages";
import { SectionPayments } from "./section-payments";
import { SectionContacts } from "./section-contacts";

interface SectionEditorProps {
  section: SectionDraft;
  onChange: (content: SectionContent) => void;
  payments?: PaymentDraft[];
  onPaymentsChange?: (payments: PaymentDraft[]) => void;
  totalAmount?: number;
}

export function SectionEditor({
  section,
  onChange,
  payments,
  onPaymentsChange,
  totalAmount,
}: SectionEditorProps) {
  switch (section.type) {
    case ProposalSectionType.ABOUT_SOLUTION:
    case ProposalSectionType.ARCHITECTURE:
    case ProposalSectionType.ADDITIONAL_TERMS:
    case ProposalSectionType.CUSTOM:
      return <SectionText content={section.content as { text: string }} onChange={onChange} />;

    case ProposalSectionType.TECH_STACK:
      return (
        <SectionList
          variant="tech-stack"
          content={section.content as TechStackContent}
          onChange={onChange}
        />
      );

    case ProposalSectionType.KEY_ADVANTAGES:
      return (
        <SectionList
          variant="advantages"
          content={section.content as KeyAdvantagesContent}
          onChange={onChange}
        />
      );

    case ProposalSectionType.FUNCTIONAL_MODULES:
      return (
        <SectionModules
          content={section.content as FunctionalModulesContent}
          onChange={onChange}
        />
      );

    case ProposalSectionType.IMPLEMENTATION_STAGES:
      return (
        <SectionStages
          content={section.content as ImplementationStagesContent}
          onChange={onChange}
        />
      );

    case ProposalSectionType.PAYMENT_SCHEDULE:
      return (
        <SectionPayments
          payments={payments || []}
          onChange={onPaymentsChange || (() => {})}
          totalAmount={totalAmount || 0}
        />
      );

    case ProposalSectionType.CONTACT_INFO:
      return (
        <SectionContacts
          content={section.content as ContactInfoContent}
          onChange={onChange}
        />
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Неизвестный тип секции
        </p>
      );
  }
}
