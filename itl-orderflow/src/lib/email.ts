import { Resend } from "resend";
import { logger } from "@/lib/logger";

const log = logger.create("Email");

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "ITL OrderFlow <noreply@itl.tj>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    log.info("Skipping — RESEND_API_KEY not configured");
    return { success: true, skipped: true };
  }

  try {
    const result = await getResend()!.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    log.error("Send error", error);
    return { error: "Failed to send email" };
  }
}

// ==================== EMAIL TEMPLATES ====================

export function invoiceSentEmail(data: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  portalUrl?: string;
}) {
  return {
    subject: `Новый счёт ${escapeHtml(data.invoiceNumber)} от ITL Solutions`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">ITL Solutions</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Уважаемый(ая) ${escapeHtml(data.clientName)},</p>
          <p>Вам выставлен новый счёт:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Номер:</strong> ${escapeHtml(data.invoiceNumber)}</p>
            <p style="margin: 4px 0;"><strong>Сумма:</strong> ${escapeHtml(data.amount)}</p>
            <p style="margin: 4px 0;"><strong>Срок оплаты:</strong> ${escapeHtml(data.dueDate)}</p>
          </div>
          ${
            data.portalUrl
              ? `<a href="${data.portalUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Открыть в портале</a>`
              : ""
          }
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            С уважением,<br>ITL Solutions
          </p>
        </div>
      </div>
    `,
  };
}

export function orderStatusEmail(data: {
  clientName: string;
  orderNumber: string;
  orderTitle: string;
  newStatus: string;
  portalUrl?: string;
}) {
  return {
    subject: `Обновление статуса проекта ${escapeHtml(data.orderNumber)}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">ITL Solutions</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Уважаемый(ая) ${escapeHtml(data.clientName)},</p>
          <p>Статус вашего проекта обновлён:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Проект:</strong> ${escapeHtml(data.orderNumber)} — ${escapeHtml(data.orderTitle)}</p>
            <p style="margin: 4px 0;"><strong>Новый статус:</strong> ${escapeHtml(data.newStatus)}</p>
          </div>
          ${
            data.portalUrl
              ? `<a href="${data.portalUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Посмотреть в портале</a>`
              : ""
          }
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            С уважением,<br>ITL Solutions
          </p>
        </div>
      </div>
    `,
  };
}

export function milestoneReadyEmail(data: {
  clientName: string;
  orderNumber: string;
  milestoneTitle: string;
  portalUrl?: string;
}) {
  return {
    subject: `Этап "${escapeHtml(data.milestoneTitle)}" готов к согласованию`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">ITL Solutions</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Уважаемый(ая) ${escapeHtml(data.clientName)},</p>
          <p>Этап вашего проекта ${escapeHtml(data.orderNumber)} завершён и готов к согласованию:</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; font-size: 16px;">${escapeHtml(data.milestoneTitle)}</p>
          </div>
          <p>Пожалуйста, проверьте результаты и подтвердите согласование в портале.</p>
          ${
            data.portalUrl
              ? `<a href="${data.portalUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Согласовать этап</a>`
              : ""
          }
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            С уважением,<br>ITL Solutions
          </p>
        </div>
      </div>
    `,
  };
}

export function portalTokenEmail(data: {
  clientName: string;
  portalUrl: string;
}) {
  return {
    subject: "Доступ к клиентскому порталу ITL Solutions",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">ITL Solutions</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Уважаемый(ая) ${escapeHtml(data.clientName)},</p>
          <p>Для вас создан доступ к клиентскому порталу, где вы можете отслеживать прогресс ваших проектов, согласовывать этапы и просматривать счета.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.portalUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Войти в портал</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Сохраните эту ссылку — она является вашим ключом доступа к порталу.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            С уважением,<br>ITL Solutions
          </p>
        </div>
      </div>
    `,
  };
}
