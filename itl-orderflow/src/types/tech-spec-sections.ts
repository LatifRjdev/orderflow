import { TechSpecSectionType } from "@prisma/client";

// ==================== Content types per section ====================

export interface SpecTextContent {
  text: string;
}

export interface GoalItem {
  goal: string;
  priority: string;
}

export interface GoalsContent {
  items: GoalItem[];
}

export interface FunctionalModule {
  name: string;
  description: string;
  requirements: string[];
}

export interface FunctionalRequirementsContent {
  modules: FunctionalModule[];
}

export interface NonFunctionalItem {
  category: string;
  requirement: string;
}

export interface NonFunctionalRequirementsContent {
  items: NonFunctionalItem[];
}

export interface TechStackItem {
  name: string;
  description: string;
}

export interface SpecTechStackContent {
  items: TechStackItem[];
}

export interface TimelinePhase {
  name: string;
  duration: string;
  deliverables: string;
}

export interface TimelineContent {
  phases: TimelinePhase[];
}

export interface AcceptanceCriterionItem {
  criterion: string;
  method: string;
}

export interface AcceptanceCriteriaContent {
  items: AcceptanceCriterionItem[];
}

export type SpecSectionContent =
  | SpecTextContent
  | GoalsContent
  | FunctionalRequirementsContent
  | NonFunctionalRequirementsContent
  | SpecTechStackContent
  | TimelineContent
  | AcceptanceCriteriaContent;

// ==================== Labels ====================

export const SPEC_SECTION_TYPE_LABELS: Record<TechSpecSectionType, string> = {
  INTRODUCTION: "Введение",
  GOALS: "Цели",
  FUNCTIONAL_REQUIREMENTS: "Функциональные требования",
  NON_FUNCTIONAL_REQUIREMENTS: "Нефункциональные требования",
  TECH_STACK: "Технологии",
  TIMELINE: "Сроки",
  ACCEPTANCE_CRITERIA: "Критерии приёмки",
  CUSTOM: "Произвольный раздел",
};

// ==================== Default content per type ====================

export function getDefaultSpecContent(type: TechSpecSectionType): SpecSectionContent {
  switch (type) {
    case "INTRODUCTION":
      return { text: "" };
    case "GOALS":
      return { items: [{ goal: "", priority: "Высокий" }] };
    case "FUNCTIONAL_REQUIREMENTS":
      return { modules: [{ name: "", description: "", requirements: [""] }] };
    case "NON_FUNCTIONAL_REQUIREMENTS":
      return { items: [{ category: "", requirement: "" }] };
    case "TECH_STACK":
      return { items: [{ name: "", description: "" }] };
    case "TIMELINE":
      return { phases: [{ name: "", duration: "", deliverables: "" }] };
    case "ACCEPTANCE_CRITERIA":
      return { items: [{ criterion: "", method: "" }] };
    case "CUSTOM":
      return { text: "" };
  }
}

// ==================== Draft type ====================

export interface SpecSectionDraft {
  type: TechSpecSectionType;
  title: string;
  content: SpecSectionContent;
  position: number;
  isVisible: boolean;
}

// ==================== Default sections for new tech spec ====================

export const DEFAULT_SPEC_SECTIONS: SpecSectionDraft[] = [
  {
    type: "INTRODUCTION",
    title: "Введение",
    content: { text: "" },
    position: 0,
    isVisible: true,
  },
  {
    type: "GOALS",
    title: "Цели",
    content: { items: [{ goal: "", priority: "Высокий" }] },
    position: 1,
    isVisible: true,
  },
  {
    type: "FUNCTIONAL_REQUIREMENTS",
    title: "Функциональные требования",
    content: { modules: [{ name: "", description: "", requirements: [""] }] },
    position: 2,
    isVisible: true,
  },
  {
    type: "TECH_STACK",
    title: "Технологии",
    content: { items: [{ name: "", description: "" }] },
    position: 3,
    isVisible: true,
  },
  {
    type: "TIMELINE",
    title: "Сроки",
    content: { phases: [{ name: "", duration: "", deliverables: "" }] },
    position: 4,
    isVisible: true,
  },
];
