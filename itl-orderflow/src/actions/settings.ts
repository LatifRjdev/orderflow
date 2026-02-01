"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth-guard";

// Get settings
export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

// Update organization settings
export async function updateOrganizationSettings(formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const data: Record<string, string | undefined> = {};

    const fields = [
      "companyName",
      "companyLegalName",
      "companyInn",
      "companyEmail",
      "companyPhone",
      "companyWebsite",
      "companyAddress",
      "bankName",
      "bankAccount",
    ];

    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null) {
        data[field] = (value as string) || undefined;
      }
    }

    // companyName is required
    if (!data.companyName) {
      return { error: "Название компании обязательно" };
    }

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    revalidatePath("/settings");
    return { success: true, settings };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { error: "Ошибка при обновлении настроек" };
  }
}

// Update numbering settings
export async function updateNumberingSettings(formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const data: Record<string, string | number> = {};

    const orderPrefix = formData.get("orderPrefix") as string;
    const invoicePrefix = formData.get("invoicePrefix") as string;
    const proposalPrefix = formData.get("proposalPrefix") as string;
    const currency = formData.get("currency") as string;
    const timezone = formData.get("timezone") as string;

    if (orderPrefix) data.orderPrefix = orderPrefix;
    if (invoicePrefix) data.invoicePrefix = invoicePrefix;
    if (proposalPrefix) data.proposalPrefix = proposalPrefix;
    if (currency) data.currency = currency;
    if (timezone) data.timezone = timezone;

    const settings = await prisma.settings.update({
      where: { id: "default" },
      data,
    });

    revalidatePath("/settings");
    return { success: true, settings };
  } catch (error) {
    console.error("Error updating numbering settings:", error);
    return { error: "Ошибка при обновлении настроек нумерации" };
  }
}
