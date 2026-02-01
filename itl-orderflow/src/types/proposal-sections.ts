import { ProposalSectionType } from "@prisma/client";

// ==================== Content types per section ====================

export interface AboutSolutionContent {
  text: string;
}

export interface TechStackItem {
  name: string;
  description?: string;
  category?: string;
}

export interface TechStackContent {
  items: TechStackItem[];
}

export interface KeyAdvantageItem {
  title: string;
  description?: string;
}

export interface KeyAdvantagesContent {
  items: KeyAdvantageItem[];
}

export interface FunctionalModule {
  name: string;
  description: string;
  features: string[];
}

export interface FunctionalModulesContent {
  modules: FunctionalModule[];
}

export interface ArchitectureContent {
  text: string;
}

export interface ImplementationStage {
  name: string;
  description: string;
  duration: string;
}

export interface ImplementationStagesContent {
  stages: ImplementationStage[];
}

export interface PaymentScheduleContent {
  note?: string;
}

export interface AdditionalTermsContent {
  text: string;
}

export interface ContactInfoContent {
  autoFromSettings: boolean;
  customText?: string;
}

export interface CustomSectionContent {
  text: string;
}

export type SectionContent =
  | AboutSolutionContent
  | TechStackContent
  | KeyAdvantagesContent
  | FunctionalModulesContent
  | ArchitectureContent
  | ImplementationStagesContent
  | PaymentScheduleContent
  | AdditionalTermsContent
  | ContactInfoContent
  | CustomSectionContent;

// ==================== Labels ====================

export const SECTION_TYPE_LABELS: Record<ProposalSectionType, string> = {
  ABOUT_SOLUTION: "О решении",
  TECH_STACK: "Технологический стек",
  KEY_ADVANTAGES: "Ключевые преимущества",
  FUNCTIONAL_MODULES: "Функциональные модули",
  ARCHITECTURE: "Архитектура",
  IMPLEMENTATION_STAGES: "Этапы внедрения",
  PAYMENT_SCHEDULE: "График оплаты",
  ADDITIONAL_TERMS: "Дополнительные условия",
  CONTACT_INFO: "Контактная информация",
  CUSTOM: "Произвольный раздел",
};

// ==================== Default content per type ====================

export function getDefaultContent(type: ProposalSectionType): SectionContent {
  switch (type) {
    case "ABOUT_SOLUTION":
      return { text: "" };
    case "TECH_STACK":
      return { items: [{ name: "", description: "" }] };
    case "KEY_ADVANTAGES":
      return { items: [{ title: "", description: "" }] };
    case "FUNCTIONAL_MODULES":
      return { modules: [{ name: "", description: "", features: [""] }] };
    case "ARCHITECTURE":
      return { text: "" };
    case "IMPLEMENTATION_STAGES":
      return { stages: [{ name: "", description: "", duration: "" }] };
    case "PAYMENT_SCHEDULE":
      return { note: "" };
    case "ADDITIONAL_TERMS":
      return { text: "" };
    case "CONTACT_INFO":
      return { autoFromSettings: true };
    case "CUSTOM":
      return { text: "" };
  }
}

// ==================== Default sections for new proposal ====================

export interface SectionDraft {
  type: ProposalSectionType;
  title: string;
  content: SectionContent;
  position: number;
  isVisible: boolean;
}

export const DEFAULT_PROPOSAL_SECTIONS: SectionDraft[] = [
  {
    type: "ABOUT_SOLUTION",
    title: "О решении",
    content: { text: "" },
    position: 0,
    isVisible: true,
  },
  {
    type: "KEY_ADVANTAGES",
    title: "Ключевые преимущества",
    content: { items: [{ title: "", description: "" }] },
    position: 1,
    isVisible: true,
  },
  {
    type: "FUNCTIONAL_MODULES",
    title: "Функциональные модули",
    content: { modules: [{ name: "", description: "", features: [""] }] },
    position: 2,
    isVisible: true,
  },
  {
    type: "IMPLEMENTATION_STAGES",
    title: "Этапы внедрения",
    content: { stages: [{ name: "", description: "", duration: "" }] },
    position: 3,
    isVisible: true,
  },
];

// ==================== Payment draft ====================

export interface PaymentDraft {
  stageName: string;
  percentage: number;
  amount: number;
  description?: string;
  position: number;
}
