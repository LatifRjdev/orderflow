// ==================== Amendment change structure ====================

export interface AmendmentChange {
  field: string;
  oldValue: string;
  newValue: string;
}

// ==================== Field options for dropdown ====================

export const AMENDMENT_FIELD_OPTIONS = [
  { value: "deadline", label: "Сроки" },
  { value: "amount", label: "Сумма договора" },
  { value: "scope", label: "Объём работ" },
  { value: "payment_terms", label: "Условия оплаты" },
  { value: "obligations_executor", label: "Обязанности исполнителя" },
  { value: "obligations_client", label: "Обязанности заказчика" },
  { value: "liability", label: "Ответственность" },
  { value: "other", label: "Другое" },
] as const;

export type AmendmentFieldValue = (typeof AMENDMENT_FIELD_OPTIONS)[number]["value"];
