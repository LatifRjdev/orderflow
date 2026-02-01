import { SectionDraft } from "@/types/proposal-sections";

export interface ProposalPreset {
  id: string;
  name: string;
  description: string;
  sections: SectionDraft[];
}

export const PROPOSAL_PRESETS: ProposalPreset[] = [
  {
    id: "web-app",
    name: "Веб-приложение",
    description: "Полный набор разделов для коммерческого предложения по разработке веб-приложения",
    sections: [
      { type: "ABOUT_SOLUTION", title: "О решении", content: { text: "" }, position: 0, isVisible: true },
      { type: "TECH_STACK", title: "Технологический стек", content: { items: [{ name: "Next.js", description: "React-фреймворк" }, { name: "PostgreSQL", description: "Реляционная БД" }] }, position: 1, isVisible: true },
      { type: "KEY_ADVANTAGES", title: "Ключевые преимущества", content: { items: [{ title: "", description: "" }] }, position: 2, isVisible: true },
      { type: "FUNCTIONAL_MODULES", title: "Функциональные модули", content: { modules: [{ name: "", description: "", features: [""] }] }, position: 3, isVisible: true },
      { type: "ARCHITECTURE", title: "Архитектура", content: { text: "" }, position: 4, isVisible: true },
      { type: "IMPLEMENTATION_STAGES", title: "Этапы внедрения", content: { stages: [{ name: "", description: "", duration: "" }] }, position: 5, isVisible: true },
      { type: "PAYMENT_SCHEDULE", title: "График оплаты", content: { note: "" }, position: 6, isVisible: true },
      { type: "CONTACT_INFO", title: "Контактная информация", content: { autoFromSettings: true }, position: 7, isVisible: true },
    ],
  },
  {
    id: "mobile-app",
    name: "Мобильное приложение",
    description: "Шаблон для мобильной разработки с акцентом на платформы и UX",
    sections: [
      { type: "ABOUT_SOLUTION", title: "О решении", content: { text: "" }, position: 0, isVisible: true },
      { type: "TECH_STACK", title: "Технологический стек", content: { items: [{ name: "React Native", description: "Кроссплатформенная разработка" }] }, position: 1, isVisible: true },
      { type: "KEY_ADVANTAGES", title: "Ключевые преимущества", content: { items: [{ title: "", description: "" }] }, position: 2, isVisible: true },
      { type: "FUNCTIONAL_MODULES", title: "Функциональные модули", content: { modules: [{ name: "", description: "", features: [""] }] }, position: 3, isVisible: true },
      { type: "IMPLEMENTATION_STAGES", title: "Этапы внедрения", content: { stages: [{ name: "", description: "", duration: "" }] }, position: 4, isVisible: true },
      { type: "PAYMENT_SCHEDULE", title: "График оплаты", content: { note: "" }, position: 5, isVisible: true },
      { type: "CONTACT_INFO", title: "Контактная информация", content: { autoFromSettings: true }, position: 6, isVisible: true },
    ],
  },
  {
    id: "integration",
    name: "Интеграция",
    description: "Шаблон для проектов интеграции систем и API",
    sections: [
      { type: "ABOUT_SOLUTION", title: "О решении", content: { text: "" }, position: 0, isVisible: true },
      { type: "TECH_STACK", title: "Технологический стек", content: { items: [{ name: "", description: "" }] }, position: 1, isVisible: true },
      { type: "ARCHITECTURE", title: "Архитектура интеграции", content: { text: "" }, position: 2, isVisible: true },
      { type: "IMPLEMENTATION_STAGES", title: "Этапы внедрения", content: { stages: [{ name: "", description: "", duration: "" }] }, position: 3, isVisible: true },
      { type: "ADDITIONAL_TERMS", title: "Дополнительные условия", content: { text: "" }, position: 4, isVisible: true },
      { type: "CONTACT_INFO", title: "Контактная информация", content: { autoFromSettings: true }, position: 5, isVisible: true },
    ],
  },
  {
    id: "minimal",
    name: "Минимальный",
    description: "Краткое КП с основными разделами для небольших проектов",
    sections: [
      { type: "ABOUT_SOLUTION", title: "О решении", content: { text: "" }, position: 0, isVisible: true },
      { type: "IMPLEMENTATION_STAGES", title: "Этапы внедрения", content: { stages: [{ name: "", description: "", duration: "" }] }, position: 1, isVisible: true },
      { type: "PAYMENT_SCHEDULE", title: "График оплаты", content: { note: "" }, position: 2, isVisible: true },
      { type: "CONTACT_INFO", title: "Контактная информация", content: { autoFromSettings: true }, position: 3, isVisible: true },
    ],
  },
];
