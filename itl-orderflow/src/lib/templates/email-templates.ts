export interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  description: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "status-change",
    name: "Смена статуса заказа",
    trigger: "При изменении статуса заказа",
    subject: "Заказ {{orderNumber}} — статус изменён на «{{newStatus}}»",
    description: "Отправляется клиенту при каждом изменении статуса заказа",
  },
  {
    id: "stage-review",
    name: "Этап на проверку",
    trigger: "При завершении этапа",
    subject: "Этап «{{stageName}}» заказа {{orderNumber}} готов к проверке",
    description: "Уведомление клиенту о готовности этапа к приёмке",
  },
  {
    id: "new-proposal",
    name: "Новое коммерческое предложение",
    trigger: "При отправке КП клиенту",
    subject: "Коммерческое предложение от {{companyName}}",
    description: "Сопроводительное письмо при отправке КП на email клиента",
  },
];
