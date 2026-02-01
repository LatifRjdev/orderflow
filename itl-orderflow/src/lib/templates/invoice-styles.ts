export interface InvoiceStyle {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  features: string[];
}

export const INVOICE_STYLES: InvoiceStyle[] = [
  {
    id: "standard",
    name: "Стандартный",
    description: "Чистый минималистичный дизайн для повседневных счетов",
    accentColor: "#3B82F6",
    features: ["Логотип компании", "Реквизиты", "Таблица услуг", "Итоговая сумма"],
  },
  {
    id: "branded",
    name: "Фирменный",
    description: "Расширенный шаблон с фирменными цветами и стилем",
    accentColor: "#8B5CF6",
    features: ["Фирменная шапка", "Цветовая схема", "Доп. информация о компании", "QR-код для оплаты"],
  },
  {
    id: "detailed",
    name: "Подробный",
    description: "Детализированный шаблон с разбивкой по этапам и часам",
    accentColor: "#10B981",
    features: ["Разбивка по этапам", "Часы и ставки", "Промежуточные итоги", "Условия оплаты"],
  },
];
