import { ContractSectionType } from "@prisma/client";

// ==================== Content types per section ====================

export interface ContractTextContent {
  text: string;
}

export interface ObligationItem {
  title: string;
  description: string;
}

export interface ObligationsContent {
  items: ObligationItem[];
}

export interface PaymentScheduleItem {
  milestone: string;
  percentage: number;
  amount: number;
}

export interface PaymentTermsContent {
  text: string;
  schedule?: PaymentScheduleItem[];
}

export interface SignaturesContent {
  autoFromSettings: boolean;
  customText?: string;
}

export type ContractSectionContent =
  | ContractTextContent
  | ObligationsContent
  | PaymentTermsContent
  | SignaturesContent;

// ==================== Labels ====================

export const CONTRACT_SECTION_TYPE_LABELS: Record<ContractSectionType, string> = {
  SUBJECT: "Предмет договора",
  OBLIGATIONS_EXECUTOR: "Обязанности исполнителя",
  OBLIGATIONS_CLIENT: "Обязанности заказчика",
  PAYMENT_TERMS: "Условия оплаты",
  LIABILITY: "Ответственность сторон",
  DISPUTE_RESOLUTION: "Разрешение споров",
  FORCE_MAJEURE: "Форс-мажор",
  SIGNATURES: "Подписи сторон",
  CUSTOM: "Произвольный раздел",
};

// ==================== Default content per type ====================

export function getDefaultContractContent(type: ContractSectionType): ContractSectionContent {
  switch (type) {
    case "SUBJECT":
      return { text: "" };
    case "OBLIGATIONS_EXECUTOR":
      return { items: [{ title: "", description: "" }] };
    case "OBLIGATIONS_CLIENT":
      return { items: [{ title: "", description: "" }] };
    case "PAYMENT_TERMS":
      return { text: "", schedule: [] };
    case "LIABILITY":
      return { text: "" };
    case "DISPUTE_RESOLUTION":
      return { text: "" };
    case "FORCE_MAJEURE":
      return { text: "" };
    case "SIGNATURES":
      return { autoFromSettings: true };
    case "CUSTOM":
      return { text: "" };
  }
}

// ==================== Draft type ====================

export interface ContractSectionDraft {
  type: ContractSectionType;
  title: string;
  content: ContractSectionContent;
  position: number;
  isVisible: boolean;
}

// ==================== Default sections for new contract ====================

export const DEFAULT_CONTRACT_SECTIONS: ContractSectionDraft[] = [
  {
    type: "SUBJECT",
    title: "Предмет договора",
    content: { text: "" },
    position: 0,
    isVisible: true,
  },
  {
    type: "OBLIGATIONS_EXECUTOR",
    title: "Обязанности исполнителя",
    content: { items: [{ title: "", description: "" }] },
    position: 1,
    isVisible: true,
  },
  {
    type: "OBLIGATIONS_CLIENT",
    title: "Обязанности заказчика",
    content: { items: [{ title: "", description: "" }] },
    position: 2,
    isVisible: true,
  },
  {
    type: "PAYMENT_TERMS",
    title: "Условия оплаты",
    content: { text: "", schedule: [] },
    position: 3,
    isVisible: true,
  },
  {
    type: "LIABILITY",
    title: "Ответственность сторон",
    content: { text: "" },
    position: 4,
    isVisible: true,
  },
  {
    type: "SIGNATURES",
    title: "Подписи сторон",
    content: { autoFromSettings: true },
    position: 5,
    isVisible: true,
  },
];
