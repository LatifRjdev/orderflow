"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(255),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  role: z.enum(["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"]),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MANAGER", "DEVELOPER", "VIEWER"]).optional(),
});

// Get all users
export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { managedOrders: true, assignedTasks: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return users;
}

// Create user
export async function createUser(formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const validated = createUserSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });
    if (existing) {
      return { error: "Пользователь с таким email уже существует" };
    }

    const hashedPassword = await bcrypt.hash(validated.data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
      },
    });

    revalidatePath("/settings");
    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Ошибка при создании пользователя" };
  }
}

// Update user
export async function updateUser(id: string, formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData: Record<string, string> = {};
  const fields = ["name", "email", "role"];
  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      rawData[field] = value as string;
    }
  }

  const validated = updateUserSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // If email is changing, check uniqueness
    if (validated.data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: validated.data.email, NOT: { id } },
      });
      if (existing) {
        return { error: "Пользователь с таким email уже существует" };
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/settings");
    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Ошибка при обновлении пользователя" };
  }
}

// Toggle user active status
export async function toggleUserActive(id: string) {
  await requireRole(["ADMIN"]);

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { error: "Пользователь не найден" };

    await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user:", error);
    return { error: "Ошибка при обновлении пользователя" };
  }
}

// Reset user password (admin only)
export async function resetUserPassword(id: string, newPassword: string) {
  await requireRole(["ADMIN"]);

  if (!newPassword || newPassword.length < 6) {
    return { error: "Пароль должен быть не менее 6 символов" };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "Ошибка при сбросе пароля" };
  }
}
