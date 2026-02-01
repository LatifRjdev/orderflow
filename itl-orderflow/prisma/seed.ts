import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаю сидинг базы данных...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@itl.tj";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required for seeding.\n" +
      "Set it before running seed: ADMIN_PASSWORD=YourSecurePassword123 npx prisma db seed"
    );
  }

  // ==================== SETTINGS ====================
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "ITL Solutions",
      companyEmail: "info@itl.tj",
      companyPhone: "+992 93 123 45 67",
      companyAddress: "г. Душанбе, ул. Рудаки, 123",
      companyInn: "0123456789",
      currency: "TJS",
      timezone: "Asia/Dushanbe",
      orderPrefix: "ORD",
      invoicePrefix: "INV",
      nextOrderNumber: 1,
      nextInvoiceNumber: 1,
    },
  });
  console.log("✅ Настройки созданы");

  // ==================== ORDER STATUSES ====================
  const statusDefs = [
    { name: "Новая заявка", code: "new", color: "#6B7280", position: 1, isInitial: true },
    { name: "Оценка", code: "estimation", color: "#3B82F6", position: 2 },
    { name: "КП отправлено", code: "proposal_sent", color: "#8B5CF6", position: 3, notifyClient: true },
    { name: "В работе", code: "in_progress", color: "#F59E0B", position: 4 },
    { name: "Тестирование", code: "testing", color: "#F97316", position: 5 },
    { name: "Ревью клиента", code: "client_review", color: "#EC4899", position: 6, notifyClient: true },
    { name: "Завершён", code: "completed", color: "#10B981", position: 7, isFinal: true, notifyClient: true },
    { name: "Отменён", code: "cancelled", color: "#EF4444", position: 8, isFinal: true },
  ];

  for (const s of statusDefs) {
    await prisma.orderStatus.upsert({
      where: { code: s.code },
      update: s,
      create: s,
    });
  }
  console.log("✅ Статусы заказов созданы");

  // ==================== ADMIN USER ====================
  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: passwordHash },
    create: {
      email: adminEmail,
      name: "Администратор",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Администратор создан");

  console.log("\n🎉 Сидинг завершён!");
  console.log(`🔑 Логин: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error("❌ Ошибка сидинга:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
