"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const log = logger.create("Auth");
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Rate limit: 5 attempts per 15 minutes per email
  const rl = rateLimit(`login:${email}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    const minutes = Math.ceil((rl.retryAfterMs || 0) / 60000);
    return { error: `Слишком много попыток. Повторите через ${minutes} мин.` };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Неверный email или пароль" };
        default:
          return { error: "Произошла ошибка при входе" };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

// Request password reset — always returns success (don't reveal if email exists)
export async function requestPasswordReset(email: string) {
  if (!email || !email.includes("@")) {
    return { error: "Введите корректный email" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_APP_URL is not configured");
      }
      const resetUrl = `${baseUrl}/reset-password/${token}`;

      await sendEmail({
        to: email,
        subject: "Сброс пароля — ITL OrderFlow",
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #3b82f6; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">ITL Solutions</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Вы запросили сброс пароля для вашей учётной записи.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Сбросить пароль</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Ссылка действительна 1 час. Если вы не запрашивали сброс, проигнорируйте это письмо.
              </p>
            </div>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (error) {
    log.error("Error requesting password reset", error);
    return { error: "Произошла ошибка. Попробуйте позже." };
  }
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string) {
  if (!token) {
    return { error: "Недействительная ссылка" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "Пароль должен быть не менее 6 символов" };
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { error: "Недействительная или уже использованная ссылка" };
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return { error: "Ссылка истекла. Запросите новую." };
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return { error: "Пользователь не найден" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email: resetToken.email },
      }),
    ]);

    return { success: true };
  } catch (error) {
    log.error("Error resetting password", error);
    return { error: "Произошла ошибка. Попробуйте позже." };
  }
}
