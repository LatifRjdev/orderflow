"use client";

import { ContractSectionType } from "@prisma/client";
import type { ContractSectionDraft, ContractSectionContent, ObligationsContent, PaymentTermsContent, SignaturesContent } from "@/types/contract-sections";
import { ContractSectionText } from "./contract-section-text";
import { ContractSectionObligations } from "./contract-section-obligations";
import { ContractSectionPaymentTerms } from "./contract-section-payment-terms";
import { ContractSectionSignatures } from "./contract-section-signatures";

interface ContractSectionEditorProps {
  section: ContractSectionDraft;
  onChange: (content: ContractSectionContent) => void;
}

export function ContractSectionEditor({ section, onChange }: ContractSectionEditorProps) {
  switch (section.type) {
    case ContractSectionType.SUBJECT:
    case ContractSectionType.LIABILITY:
    case ContractSectionType.DISPUTE_RESOLUTION:
    case ContractSectionType.FORCE_MAJEURE:
    case ContractSectionType.CUSTOM:
      return <ContractSectionText content={section.content as { text: string }} onChange={onChange} />;

    case ContractSectionType.OBLIGATIONS_EXECUTOR:
    case ContractSectionType.OBLIGATIONS_CLIENT:
      return (
        <ContractSectionObligations
          content={section.content as ObligationsContent}
          onChange={onChange}
        />
      );

    case ContractSectionType.PAYMENT_TERMS:
      return (
        <ContractSectionPaymentTerms
          content={section.content as PaymentTermsContent}
          onChange={onChange}
        />
      );

    case ContractSectionType.SIGNATURES:
      return (
        <ContractSectionSignatures
          content={section.content as SignaturesContent}
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
