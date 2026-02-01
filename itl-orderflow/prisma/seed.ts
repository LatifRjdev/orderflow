import {
  PrismaClient,
  Role,
  Priority,
  TaskStatus,
  MilestoneStatus,
  InvoiceStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("🌱 Начинаю сидинг базы данных...");

  // Admin credentials from environment variables
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
      nextOrderNumber: 8,
      nextInvoiceNumber: 10,
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

  const statusMap: Record<string, string> = {};
  for (const s of statusDefs) {
    const created = await prisma.orderStatus.upsert({
      where: { code: s.code },
      update: s,
      create: s,
    });
    statusMap[s.code] = created.id;
  }
  console.log("✅ Статусы заказов созданы");

  // ==================== USERS ====================
  const adminPasswordHash = await hash(adminPassword, 12);
  const defaultPasswordHash = await hash("changeme2026", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Латиф Рахимов",
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: "firuz@itl.tj" },
    update: {},
    create: {
      email: "firuz@itl.tj",
      name: "Фируз Каримов",
      password: defaultPasswordHash,
      role: Role.MANAGER,
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: "madina@itl.tj" },
    update: {},
    create: {
      email: "madina@itl.tj",
      name: "Мадина Сафарова",
      password: defaultPasswordHash,
      role: Role.MANAGER,
    },
  });

  const dev1 = await prisma.user.upsert({
    where: { email: "rustam@itl.tj" },
    update: {},
    create: {
      email: "rustam@itl.tj",
      name: "Рустам Назаров",
      password: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.upsert({
    where: { email: "dilshod@itl.tj" },
    update: {},
    create: {
      email: "dilshod@itl.tj",
      name: "Дильшод Ахмедов",
      password: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.upsert({
    where: { email: "zarina@itl.tj" },
    update: {},
    create: {
      email: "zarina@itl.tj",
      name: "Зарина Мирзоева",
      password: defaultPasswordHash,
      role: Role.DEVELOPER,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@itl.tj" },
    update: {},
    create: {
      email: "viewer@itl.tj",
      name: "Саид Исломов",
      password: defaultPasswordHash,
      role: Role.VIEWER,
    },
  });

  console.log("✅ Пользователи созданы (7 человек)");

  // ==================== CLIENTS ====================

  // Client 1 — ТехноСофт
  const client1 = await prisma.client.upsert({
    where: { id: "client-technosoft" },
    update: {},
    create: {
      id: "client-technosoft",
      name: "ООО ТехноСофт",
      legalName: 'ООО "ТехноСофт"',
      inn: "7707083893",
      email: "info@technosoft.tj",
      phone: "+992 37 221-22-33",
      website: "https://technosoft.tj",
      industry: "Информационные технологии",
      address: "г. Душанбе, ул. Айни, 56",
      portalEnabled: true,
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "contact-ivan" },
    update: {},
    create: {
      id: "contact-ivan",
      clientId: client1.id,
      firstName: "Иван",
      lastName: "Петров",
      position: "CTO",
      email: "ivan@technosoft.tj",
      phone: "+992 93 111-22-33",
      isPrimary: true,
      isDecisionMaker: true,
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "contact-anna" },
    update: {},
    create: {
      id: "contact-anna",
      clientId: client1.id,
      firstName: "Анна",
      lastName: "Козлова",
      position: "Менеджер проектов",
      email: "anna@technosoft.tj",
      phone: "+992 93 111-44-55",
    },
  });

  // Client 2 — MegaShop
  const client2 = await prisma.client.upsert({
    where: { id: "client-megashop" },
    update: {},
    create: {
      id: "client-megashop",
      name: "MegaShop",
      legalName: 'ООО "МегаШоп"',
      inn: "5501234567",
      email: "contact@megashop.tj",
      phone: "+992 44 600-70-80",
      website: "https://megashop.tj",
      industry: "E-commerce",
      address: "г. Душанбе, пр. Исмоили Сомони, 42",
      portalEnabled: true,
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "contact-aziz" },
    update: {},
    create: {
      id: "contact-aziz",
      clientId: client2.id,
      firstName: "Азиз",
      lastName: "Рахимов",
      position: "Директор",
      email: "aziz@megashop.tj",
      phone: "+992 93 222-33-44",
      isPrimary: true,
      isDecisionMaker: true,
    },
  });

  // Client 3 — Банк Эсхата
  const client3 = await prisma.client.upsert({
    where: { id: "client-eskhata" },
    update: {},
    create: {
      id: "client-eskhata",
      name: "Банк Эсхата",
      legalName: 'ОАО "Банк Эсхата"',
      inn: "0203456789",
      email: "it@eskhata.tj",
      phone: "+992 37 227-33-44",
      website: "https://eskhata.tj",
      industry: "Банковское дело",
      address: "г. Душанбе, ул. Шотемур, 12",
      portalEnabled: true,
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "contact-farrukh" },
    update: {},
    create: {
      id: "contact-farrukh",
      clientId: client3.id,
      firstName: "Фаррух",
      lastName: "Шарипов",
      position: "Начальник IT-отдела",
      email: "farrukh@eskhata.tj",
      phone: "+992 93 333-44-55",
      isPrimary: true,
      isDecisionMaker: true,
    },
  });

  // Client 4 — ТочикСтрой
  const client4 = await prisma.client.upsert({
    where: { id: "client-tochikstroy" },
    update: {},
    create: {
      id: "client-tochikstroy",
      name: "ТочикСтрой",
      legalName: 'ООО "ТочикСтрой"',
      inn: "0304567890",
      email: "info@tochikstroy.tj",
      phone: "+992 37 228-55-66",
      industry: "Строительство",
      address: "г. Душанбе, ул. Борбад, 78",
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "contact-karim" },
    update: {},
    create: {
      id: "contact-karim",
      clientId: client4.id,
      firstName: "Карим",
      lastName: "Бобоев",
      position: "Зам. директора",
      email: "karim@tochikstroy.tj",
      phone: "+992 93 444-55-66",
      isPrimary: true,
      isDecisionMaker: true,
    },
  });

  // Client 5 — Саломат Фарм
  const client5 = await prisma.client.upsert({
    where: { id: "client-salomat" },
    update: {},
    create: {
      id: "client-salomat",
      name: "Саломат Фарм",
      legalName: 'ООО "Саломат Фарм"',
      inn: "0405678901",
      email: "info@saomatfarm.tj",
      phone: "+992 37 229-66-77",
      industry: "Фармацевтика",
      address: "г. Душанбе, ул. Лахути, 15",
    },
  });
  await prisma.clientContact.upsert({
    where: { id: "contact-nilufar" },
    update: {},
    create: {
      id: "contact-nilufar",
      clientId: client5.id,
      firstName: "Нилуфар",
      lastName: "Хасанова",
      position: "Маркетолог",
      email: "nilufar@salomatfarm.tj",
      phone: "+992 93 555-66-77",
      isPrimary: true,
    },
  });

  console.log("✅ Клиенты созданы (5 компаний с контактами)");

  // ==================== ORDERS ====================

  // Order 1 — Клиентский портал (IN_PROGRESS, 65%)
  const order1 = await prisma.order.upsert({
    where: { number: "ORD-2026-001" },
    update: {},
    create: {
      number: "ORD-2026-001",
      title: "Разработка клиентского портала",
      description:
        "Создание веб-портала для клиентов с возможностью отслеживания заказов, просмотра счетов и коммуникации с командой разработки.",
      projectType: "Веб-разработка",
      clientId: client1.id,
      statusId: statusMap["in_progress"],
      managerId: manager1.id,
      priority: Priority.HIGH,
      estimatedStartDate: daysAgo(45),
      actualStartDate: daysAgo(42),
      deadline: daysFromNow(30),
      estimatedHours: 320,
      estimatedBudget: 85000,
      currency: "TJS",
      progressPercent: 65,
    },
  });

  // Order 2 — Интернет-магазин (IN_PROGRESS, 40%)
  const order2 = await prisma.order.upsert({
    where: { number: "ORD-2026-002" },
    update: {},
    create: {
      number: "ORD-2026-002",
      title: "Редизайн интернет-магазина",
      description:
        "Полный редизайн MegaShop: новый UI/UX, мобильная адаптация, интеграция платёжных систем Корти Милли и Click.",
      projectType: "E-commerce",
      clientId: client2.id,
      statusId: statusMap["in_progress"],
      managerId: manager2.id,
      priority: Priority.HIGH,
      estimatedStartDate: daysAgo(30),
      actualStartDate: daysAgo(28),
      deadline: daysFromNow(45),
      estimatedHours: 240,
      estimatedBudget: 65000,
      currency: "TJS",
      progressPercent: 40,
    },
  });

  // Order 3 — Мобильное приложение банка (TESTING, 85%)
  const order3 = await prisma.order.upsert({
    where: { number: "ORD-2026-003" },
    update: {},
    create: {
      number: "ORD-2026-003",
      title: "Мобильное приложение банка",
      description:
        "Разработка мобильного банка на React Native: авторизация, переводы, оплата услуг, push-уведомления.",
      projectType: "Мобильная разработка",
      clientId: client3.id,
      statusId: statusMap["testing"],
      managerId: manager1.id,
      priority: Priority.URGENT,
      estimatedStartDate: daysAgo(90),
      actualStartDate: daysAgo(88),
      deadline: daysFromNow(10),
      estimatedHours: 480,
      estimatedBudget: 150000,
      currency: "TJS",
      progressPercent: 85,
    },
  });

  // Order 4 — CRM для строительной компании (CLIENT_REVIEW, 90%)
  const order4 = await prisma.order.upsert({
    where: { number: "ORD-2026-004" },
    update: {},
    create: {
      number: "ORD-2026-004",
      title: "CRM-система для управления проектами",
      description:
        "CRM-система для строительной компании: учёт объектов, подрядчиков, расчёт сметы, контроль выполнения.",
      projectType: "Корпоративная система",
      clientId: client4.id,
      statusId: statusMap["client_review"],
      managerId: manager2.id,
      priority: Priority.MEDIUM,
      estimatedStartDate: daysAgo(120),
      actualStartDate: daysAgo(118),
      deadline: daysFromNow(5),
      estimatedHours: 400,
      estimatedBudget: 120000,
      currency: "TJS",
      progressPercent: 90,
    },
  });

  // Order 5 — Лендинг для фарм (COMPLETED, 100%)
  const order5 = await prisma.order.upsert({
    where: { number: "ORD-2026-005" },
    update: {},
    create: {
      number: "ORD-2026-005",
      title: "Лендинг и каталог продукции",
      description:
        "Промо-сайт с каталогом лекарственных препаратов, системой поиска по МНН и формой заявки.",
      projectType: "Веб-разработка",
      clientId: client5.id,
      statusId: statusMap["completed"],
      managerId: manager1.id,
      priority: Priority.LOW,
      estimatedStartDate: daysAgo(60),
      actualStartDate: daysAgo(58),
      actualEndDate: daysAgo(10),
      deadline: daysAgo(5),
      estimatedHours: 80,
      estimatedBudget: 25000,
      currency: "TJS",
      progressPercent: 100,
    },
  });

  // Order 6 — Новая заявка (NEW)
  const order6 = await prisma.order.upsert({
    where: { number: "ORD-2026-006" },
    update: {},
    create: {
      number: "ORD-2026-006",
      title: "Разработка Telegram-бота для доставки",
      description: "Бот для оформления и отслеживания заказов доставки еды с интеграцией через API.",
      projectType: "Боты и интеграции",
      clientId: client2.id,
      statusId: statusMap["new"],
      managerId: null,
      priority: Priority.MEDIUM,
      deadline: daysFromNow(60),
      estimatedHours: 100,
      estimatedBudget: 30000,
      currency: "TJS",
      progressPercent: 0,
    },
  });

  // Order 7 — Оценка (ESTIMATION)
  const order7 = await prisma.order.upsert({
    where: { number: "ORD-2026-007" },
    update: {},
    create: {
      number: "ORD-2026-007",
      title: "Автоматизация документооборота",
      description:
        "Система электронного документооборота: согласование, маршрутизация, ЭЦП, архив.",
      projectType: "Корпоративная система",
      clientId: client3.id,
      statusId: statusMap["estimation"],
      managerId: manager2.id,
      priority: Priority.HIGH,
      deadline: daysFromNow(90),
      estimatedHours: 500,
      estimatedBudget: 200000,
      currency: "TJS",
      progressPercent: 0,
    },
  });

  console.log("✅ Заказы созданы (7 заказов в разных статусах)");

  // ==================== MILESTONES ====================

  // Order 1 milestones
  const m1_1 = await prisma.milestone.upsert({
    where: { id: "m1-design" },
    update: {},
    create: {
      id: "m1-design",
      orderId: order1.id,
      title: "Дизайн и прототипирование",
      description: "Создание дизайн-макетов и интерактивного прототипа в Figma",
      position: 1,
      startDate: daysAgo(42),
      dueDate: daysAgo(25),
      completedAt: daysAgo(24),
      status: MilestoneStatus.COMPLETED,
      estimatedHours: 60,
      progressPercent: 100,
      requiresApproval: true,
      clientApprovedAt: daysAgo(23),
    },
  });

  const m1_2 = await prisma.milestone.upsert({
    where: { id: "m1-frontend" },
    update: {},
    create: {
      id: "m1-frontend",
      orderId: order1.id,
      title: "Frontend разработка",
      description: "Вёрстка и реализация клиентской части на Next.js",
      position: 2,
      startDate: daysAgo(24),
      dueDate: daysFromNow(5),
      status: MilestoneStatus.IN_PROGRESS,
      estimatedHours: 120,
      progressPercent: 70,
      requiresApproval: true,
    },
  });

  const m1_3 = await prisma.milestone.upsert({
    where: { id: "m1-backend" },
    update: {},
    create: {
      id: "m1-backend",
      orderId: order1.id,
      title: "Backend и API",
      description: "Разработка серверной части, REST API, базы данных",
      position: 3,
      startDate: daysAgo(20),
      dueDate: daysFromNow(15),
      status: MilestoneStatus.IN_PROGRESS,
      estimatedHours: 100,
      progressPercent: 50,
    },
  });

  const m1_4 = await prisma.milestone.upsert({
    where: { id: "m1-deploy" },
    update: {},
    create: {
      id: "m1-deploy",
      orderId: order1.id,
      title: "Тестирование и деплой",
      description: "QA, исправление багов, настройка сервера и деплой",
      position: 4,
      dueDate: daysFromNow(30),
      status: MilestoneStatus.PENDING,
      estimatedHours: 40,
      progressPercent: 0,
    },
  });

  // Order 2 milestones
  const m2_1 = await prisma.milestone.upsert({
    where: { id: "m2-ux" },
    update: {},
    create: {
      id: "m2-ux",
      orderId: order2.id,
      title: "UX-исследование",
      description: "Анализ текущего магазина, конкурентов, юзабилити-тестирование",
      position: 1,
      startDate: daysAgo(28),
      dueDate: daysAgo(15),
      completedAt: daysAgo(14),
      status: MilestoneStatus.COMPLETED,
      estimatedHours: 40,
      progressPercent: 100,
    },
  });

  const m2_2 = await prisma.milestone.upsert({
    where: { id: "m2-design" },
    update: {},
    create: {
      id: "m2-design",
      orderId: order2.id,
      title: "Новый дизайн",
      description: "Разработка дизайн-системы и макетов всех страниц",
      position: 2,
      startDate: daysAgo(14),
      dueDate: daysFromNow(5),
      status: MilestoneStatus.IN_PROGRESS,
      estimatedHours: 80,
      progressPercent: 60,
      requiresApproval: true,
    },
  });

  const m2_3 = await prisma.milestone.upsert({
    where: { id: "m2-dev" },
    update: {},
    create: {
      id: "m2-dev",
      orderId: order2.id,
      title: "Разработка и интеграция",
      description: "Frontend + Backend + интеграция с платёжными системами",
      position: 3,
      dueDate: daysFromNow(35),
      status: MilestoneStatus.PENDING,
      estimatedHours: 120,
      progressPercent: 0,
    },
  });

  // Order 3 milestones
  const m3_1 = await prisma.milestone.upsert({
    where: { id: "m3-core" },
    update: {},
    create: {
      id: "m3-core",
      orderId: order3.id,
      title: "Основной функционал",
      description: "Авторизация, главный экран, просмотр баланса, история операций",
      position: 1,
      startDate: daysAgo(88),
      dueDate: daysAgo(50),
      completedAt: daysAgo(48),
      status: MilestoneStatus.COMPLETED,
      estimatedHours: 200,
      progressPercent: 100,
    },
  });

  const m3_2 = await prisma.milestone.upsert({
    where: { id: "m3-payments" },
    update: {},
    create: {
      id: "m3-payments",
      orderId: order3.id,
      title: "Платежи и переводы",
      description: "Переводы между счетами, оплата услуг, QR-оплата",
      position: 2,
      startDate: daysAgo(48),
      dueDate: daysAgo(15),
      completedAt: daysAgo(13),
      status: MilestoneStatus.COMPLETED,
      estimatedHours: 160,
      progressPercent: 100,
    },
  });

  const m3_3 = await prisma.milestone.upsert({
    where: { id: "m3-testing" },
    update: {},
    create: {
      id: "m3-testing",
      orderId: order3.id,
      title: "QA и релиз",
      description: "Тестирование на устройствах, безопасность, публикация в App Store и Google Play",
      position: 3,
      startDate: daysAgo(13),
      dueDate: daysFromNow(10),
      status: MilestoneStatus.IN_PROGRESS,
      estimatedHours: 120,
      progressPercent: 60,
    },
  });

  console.log("✅ Этапы созданы (10 этапов для 3 заказов)");

  // ==================== TASKS ====================
  const taskDefs = [
    // Order 1 tasks
    { id: "t1-1", orderId: order1.id, milestoneId: m1_1.id, title: "Дизайн главной страницы", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 12, dueDate: daysAgo(30), completedAt: daysAgo(28) },
    { id: "t1-2", orderId: order1.id, milestoneId: m1_1.id, title: "Дизайн личного кабинета", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 16, dueDate: daysAgo(27), completedAt: daysAgo(25) },
    { id: "t1-3", orderId: order1.id, milestoneId: m1_1.id, title: "Дизайн страницы заказов", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.MEDIUM, estimatedHours: 10, dueDate: daysAgo(26), completedAt: daysAgo(24) },
    { id: "t1-4", orderId: order1.id, milestoneId: m1_2.id, title: "Вёрстка главной страницы", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 16, dueDate: daysAgo(15), completedAt: daysAgo(13) },
    { id: "t1-5", orderId: order1.id, milestoneId: m1_2.id, title: "Вёрстка личного кабинета", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 20, dueDate: daysAgo(10), completedAt: daysAgo(8) },
    { id: "t1-6", orderId: order1.id, milestoneId: m1_2.id, title: "Компонент таблицы заказов", assigneeId: dev1.id, status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, estimatedHours: 12, dueDate: daysFromNow(3) },
    { id: "t1-7", orderId: order1.id, milestoneId: m1_2.id, title: "Страница деталей заказа", assigneeId: dev2.id, status: TaskStatus.TODO, priority: Priority.MEDIUM, estimatedHours: 14, dueDate: daysFromNow(5) },
    { id: "t1-8", orderId: order1.id, milestoneId: m1_3.id, title: "API авторизации (JWT)", assigneeId: dev2.id, status: TaskStatus.DONE, priority: Priority.URGENT, estimatedHours: 16, dueDate: daysAgo(12), completedAt: daysAgo(10) },
    { id: "t1-9", orderId: order1.id, milestoneId: m1_3.id, title: "API заказов (CRUD)", assigneeId: dev2.id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, estimatedHours: 20, dueDate: daysFromNow(7) },
    { id: "t1-10", orderId: order1.id, milestoneId: m1_3.id, title: "API файлов и комментариев", assigneeId: dev2.id, status: TaskStatus.TODO, priority: Priority.MEDIUM, estimatedHours: 12, dueDate: daysFromNow(12) },
    { id: "t1-11", orderId: order1.id, milestoneId: m1_3.id, title: "Email-уведомления (Resend)", assigneeId: dev1.id, status: TaskStatus.TODO, priority: Priority.LOW, estimatedHours: 8, dueDate: daysFromNow(15) },

    // Order 2 tasks
    { id: "t2-1", orderId: order2.id, milestoneId: m2_1.id, title: "Анализ текущего магазина", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 8, dueDate: daysAgo(20), completedAt: daysAgo(18) },
    { id: "t2-2", orderId: order2.id, milestoneId: m2_1.id, title: "Юзабилити-тестирование", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.MEDIUM, estimatedHours: 12, dueDate: daysAgo(16), completedAt: daysAgo(15) },
    { id: "t2-3", orderId: order2.id, milestoneId: m2_2.id, title: "Дизайн-система (цвета, типография)", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 10, dueDate: daysAgo(8), completedAt: daysAgo(7) },
    { id: "t2-4", orderId: order2.id, milestoneId: m2_2.id, title: "Макеты каталога и карточки товара", assigneeId: dev3.id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, estimatedHours: 20, dueDate: daysFromNow(3) },
    { id: "t2-5", orderId: order2.id, milestoneId: m2_2.id, title: "Макеты корзины и оформления заказа", assigneeId: dev3.id, status: TaskStatus.TODO, priority: Priority.MEDIUM, estimatedHours: 16, dueDate: daysFromNow(5) },
    { id: "t2-6", orderId: order2.id, milestoneId: m2_2.id, title: "Адаптив для мобильных", assigneeId: dev3.id, status: TaskStatus.TODO, priority: Priority.HIGH, estimatedHours: 12, dueDate: daysFromNow(7) },

    // Order 3 tasks
    { id: "t3-1", orderId: order3.id, milestoneId: m3_1.id, title: "Экран авторизации (PIN + биометрия)", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.URGENT, estimatedHours: 24, dueDate: daysAgo(70), completedAt: daysAgo(68) },
    { id: "t3-2", orderId: order3.id, milestoneId: m3_1.id, title: "Главный экран с балансом", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 20, dueDate: daysAgo(60), completedAt: daysAgo(58) },
    { id: "t3-3", orderId: order3.id, milestoneId: m3_1.id, title: "История операций", assigneeId: dev2.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 16, dueDate: daysAgo(55), completedAt: daysAgo(52) },
    { id: "t3-4", orderId: order3.id, milestoneId: m3_2.id, title: "Перевод между счетами", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.URGENT, estimatedHours: 24, dueDate: daysAgo(35), completedAt: daysAgo(32) },
    { id: "t3-5", orderId: order3.id, milestoneId: m3_2.id, title: "Оплата коммунальных услуг", assigneeId: dev2.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 20, dueDate: daysAgo(25), completedAt: daysAgo(22) },
    { id: "t3-6", orderId: order3.id, milestoneId: m3_2.id, title: "QR-оплата", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 16, dueDate: daysAgo(18), completedAt: daysAgo(15) },
    { id: "t3-7", orderId: order3.id, milestoneId: m3_3.id, title: "Тестирование безопасности", assigneeId: dev2.id, status: TaskStatus.IN_PROGRESS, priority: Priority.URGENT, estimatedHours: 24, dueDate: daysFromNow(5) },
    { id: "t3-8", orderId: order3.id, milestoneId: m3_3.id, title: "Тестирование на iOS/Android", assigneeId: dev1.id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, estimatedHours: 16, dueDate: daysFromNow(7) },
    { id: "t3-9", orderId: order3.id, milestoneId: m3_3.id, title: "Push-уведомления", assigneeId: dev2.id, status: TaskStatus.REVIEW, priority: Priority.MEDIUM, estimatedHours: 12, dueDate: daysFromNow(3) },

    // Order 4 tasks
    { id: "t4-1", orderId: order4.id, title: "Модуль учёта объектов", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 30, dueDate: daysAgo(40), completedAt: daysAgo(38) },
    { id: "t4-2", orderId: order4.id, title: "Справочник подрядчиков", assigneeId: dev2.id, status: TaskStatus.DONE, priority: Priority.MEDIUM, estimatedHours: 20, dueDate: daysAgo(30), completedAt: daysAgo(28) },
    { id: "t4-3", orderId: order4.id, title: "Расчёт сметы (Excel-импорт)", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 24, dueDate: daysAgo(20), completedAt: daysAgo(18) },
    { id: "t4-4", orderId: order4.id, title: "Отчёты и аналитика", assigneeId: dev2.id, status: TaskStatus.REVIEW, priority: Priority.MEDIUM, estimatedHours: 20, dueDate: daysAgo(5) },

    // Order 5 tasks (all done)
    { id: "t5-1", orderId: order5.id, title: "Дизайн лендинга", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.MEDIUM, estimatedHours: 12, dueDate: daysAgo(45), completedAt: daysAgo(43) },
    { id: "t5-2", orderId: order5.id, title: "Вёрстка и анимации", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.MEDIUM, estimatedHours: 16, dueDate: daysAgo(35), completedAt: daysAgo(33) },
    { id: "t5-3", orderId: order5.id, title: "Каталог препаратов с поиском", assigneeId: dev2.id, status: TaskStatus.DONE, priority: Priority.HIGH, estimatedHours: 20, dueDate: daysAgo(25), completedAt: daysAgo(22) },
    { id: "t5-4", orderId: order5.id, title: "Форма заявки + email", assigneeId: dev1.id, status: TaskStatus.DONE, priority: Priority.MEDIUM, estimatedHours: 8, dueDate: daysAgo(15), completedAt: daysAgo(13) },
    { id: "t5-5", orderId: order5.id, title: "SEO-оптимизация", assigneeId: dev3.id, status: TaskStatus.DONE, priority: Priority.LOW, estimatedHours: 6, dueDate: daysAgo(12), completedAt: daysAgo(11) },
  ];

  for (const t of taskDefs) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }
  console.log(`✅ Задачи созданы (${taskDefs.length} задач)`);

  // ==================== TASK CHECKLISTS ====================
  const checklistDefs = [
    { id: "cl-1", taskId: "t1-6", title: "Пагинация", isCompleted: true, completedAt: daysAgo(2), position: 0 },
    { id: "cl-2", taskId: "t1-6", title: "Сортировка по колонкам", isCompleted: true, completedAt: daysAgo(1), position: 1 },
    { id: "cl-3", taskId: "t1-6", title: "Фильтры по статусу", isCompleted: false, position: 2 },
    { id: "cl-4", taskId: "t1-6", title: "Экспорт в CSV", isCompleted: false, position: 3 },
    { id: "cl-5", taskId: "t3-7", title: "Тест SQL-инъекций", isCompleted: true, completedAt: daysAgo(3), position: 0 },
    { id: "cl-6", taskId: "t3-7", title: "Тест XSS", isCompleted: true, completedAt: daysAgo(2), position: 1 },
    { id: "cl-7", taskId: "t3-7", title: "Тест CSRF", isCompleted: false, position: 2 },
    { id: "cl-8", taskId: "t3-7", title: "Проверка шифрования", isCompleted: false, position: 3 },
  ];
  for (const cl of checklistDefs) {
    await prisma.taskChecklist.upsert({
      where: { id: cl.id },
      update: {},
      create: cl,
    });
  }
  console.log("✅ Чеклисты задач созданы");

  // ==================== TIME ENTRIES ====================
  const timeEntryDefs = [
    // Recent entries for order 1
    { orderId: order1.id, taskId: "t1-6", userId: dev1.id, date: daysAgo(0), hours: 4, description: "Компонент таблицы — фильтры", isBillable: true },
    { orderId: order1.id, taskId: "t1-9", userId: dev2.id, date: daysAgo(0), hours: 6, description: "API заказов — эндпоинты list/get", isBillable: true },
    { orderId: order1.id, taskId: "t1-6", userId: dev1.id, date: daysAgo(1), hours: 7, description: "Компонент таблицы — вёрстка и пагинация", isBillable: true },
    { orderId: order1.id, taskId: "t1-9", userId: dev2.id, date: daysAgo(1), hours: 5, description: "API заказов — валидация и тесты", isBillable: true },
    { orderId: order1.id, taskId: "t1-5", userId: dev1.id, date: daysAgo(2), hours: 8, description: "Вёрстка личного кабинета — финал", isBillable: true },
    { orderId: order1.id, taskId: "t1-8", userId: dev2.id, date: daysAgo(2), hours: 6, description: "JWT авторизация — refresh token", isBillable: true },
    { orderId: order1.id, taskId: "t1-4", userId: dev1.id, date: daysAgo(3), hours: 8, description: "Главная страница — секции и адаптив", isBillable: true },
    { orderId: order1.id, taskId: "t1-8", userId: dev2.id, date: daysAgo(3), hours: 7, description: "JWT авторизация — основа", isBillable: true },
    { orderId: order1.id, userId: admin.id, date: daysAgo(4), hours: 2, description: "Код-ревью и планирование спринта", isBillable: false },

    // Order 2 entries
    { orderId: order2.id, taskId: "t2-4", userId: dev3.id, date: daysAgo(0), hours: 6, description: "Макет каталога — сетка товаров", isBillable: true },
    { orderId: order2.id, taskId: "t2-4", userId: dev3.id, date: daysAgo(1), hours: 7, description: "Макет карточки товара — детали", isBillable: true },
    { orderId: order2.id, taskId: "t2-3", userId: dev3.id, date: daysAgo(2), hours: 5, description: "Дизайн-система — компоненты в Figma", isBillable: true },
    { orderId: order2.id, taskId: "t2-3", userId: dev3.id, date: daysAgo(3), hours: 6, description: "Дизайн-система — палитра и шрифты", isBillable: true },
    { orderId: order2.id, userId: manager2.id, date: daysAgo(1), hours: 1.5, description: "Созвон с клиентом по дизайну", isBillable: false },

    // Order 3 entries
    { orderId: order3.id, taskId: "t3-7", userId: dev2.id, date: daysAgo(0), hours: 5, description: "Тестирование XSS-уязвимостей", isBillable: true },
    { orderId: order3.id, taskId: "t3-8", userId: dev1.id, date: daysAgo(0), hours: 4, description: "Тестирование на Samsung Galaxy", isBillable: true },
    { orderId: order3.id, taskId: "t3-9", userId: dev2.id, date: daysAgo(1), hours: 6, description: "Push-уведомления — Firebase FCM", isBillable: true },
    { orderId: order3.id, taskId: "t3-8", userId: dev1.id, date: daysAgo(1), hours: 5, description: "Тестирование на iPhone 15", isBillable: true },
    { orderId: order3.id, taskId: "t3-7", userId: dev2.id, date: daysAgo(2), hours: 7, description: "Тестирование SQL-инъекций", isBillable: true },
    { orderId: order3.id, userId: manager1.id, date: daysAgo(0), hours: 2, description: "Согласование сроков релиза с банком", isBillable: false },

    // Order 4 entries
    { orderId: order4.id, taskId: "t4-4", userId: dev2.id, date: daysAgo(3), hours: 6, description: "Модуль отчётов — графики", isBillable: true },
    { orderId: order4.id, taskId: "t4-4", userId: dev2.id, date: daysAgo(4), hours: 7, description: "Модуль отчётов — фильтры и экспорт", isBillable: true },
    { orderId: order4.id, taskId: "t4-3", userId: dev1.id, date: daysAgo(5), hours: 8, description: "Excel-импорт сметы — парсер", isBillable: true },

    // Order 5 entries (past)
    { orderId: order5.id, taskId: "t5-2", userId: dev1.id, date: daysAgo(35), hours: 8, description: "Вёрстка лендинга — hero и секции", isBillable: true },
    { orderId: order5.id, taskId: "t5-3", userId: dev2.id, date: daysAgo(28), hours: 7, description: "Каталог — поиск по МНН", isBillable: true },
    { orderId: order5.id, taskId: "t5-4", userId: dev1.id, date: daysAgo(14), hours: 4, description: "Форма заявки + отправка email", isBillable: true },
    { orderId: order5.id, taskId: "t5-5", userId: dev3.id, date: daysAgo(12), hours: 3, description: "Meta-теги, sitemap, robots.txt", isBillable: true },
  ];

  for (const te of timeEntryDefs) {
    await prisma.timeEntry.create({
      data: {
        orderId: te.orderId,
        taskId: te.taskId || null,
        userId: te.userId,
        date: te.date,
        hours: te.hours,
        description: te.description,
        isBillable: te.isBillable,
      },
    });
  }
  console.log(`✅ Записи времени созданы (${timeEntryDefs.length} записей)`);

  // ==================== INVOICES ====================

  // Invoice 1 — Order 1, частично оплачен
  const inv1 = await prisma.invoice.create({
    data: {
      number: "INV-2026-001",
      clientId: client1.id,
      orderId: order1.id,
      issueDate: daysAgo(30),
      dueDate: daysAgo(0),
      subtotal: 42500,
      taxAmount: 0,
      discountAmount: 0,
      total: 42500,
      currency: "TJS",
      status: InvoiceStatus.PARTIALLY_PAID,
      paidAmount: 25000,
      paidAt: null,
      notes: "Аванс за первый этап разработки портала",
      items: {
        create: [
          { description: "Дизайн и прототипирование", quantity: 1, unitPrice: 18000, total: 18000, position: 0 },
          { description: "Frontend разработка (аванс 50%)", quantity: 1, unitPrice: 24500, total: 24500, position: 1 },
        ],
      },
    },
  });
  // Payment for inv1
  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 25000,
      paymentDate: daysAgo(25),
      paymentMethod: "Банковский перевод",
      reference: "ПП-2026-0341",
    },
  });

  // Invoice 2 — Order 3, полностью оплачен
  const inv2 = await prisma.invoice.create({
    data: {
      number: "INV-2026-002",
      clientId: client3.id,
      orderId: order3.id,
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      subtotal: 75000,
      taxAmount: 0,
      discountAmount: 0,
      total: 75000,
      currency: "TJS",
      status: InvoiceStatus.PAID,
      paidAmount: 75000,
      paidAt: daysAgo(28),
      notes: "Аванс 50% за мобильное приложение банка",
      items: {
        create: [
          { description: "Мобильное приложение — аванс 50%", quantity: 1, unitPrice: 75000, total: 75000, position: 0 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      amount: 75000,
      paymentDate: daysAgo(28),
      paymentMethod: "Банковский перевод",
      reference: "ПП-2026-0298",
    },
  });

  // Invoice 3 — Order 3, отправлен (ещё не оплачен)
  const inv3 = await prisma.invoice.create({
    data: {
      number: "INV-2026-003",
      clientId: client3.id,
      orderId: order3.id,
      issueDate: daysAgo(10),
      dueDate: daysFromNow(20),
      subtotal: 75000,
      taxAmount: 0,
      discountAmount: 0,
      total: 75000,
      currency: "TJS",
      status: InvoiceStatus.SENT,
      paidAmount: 0,
      notes: "Финальная оплата 50% за мобильное приложение банка",
      items: {
        create: [
          { description: "Мобильное приложение — финал 50%", quantity: 1, unitPrice: 75000, total: 75000, position: 0 },
        ],
      },
    },
  });

  // Invoice 4 — Order 4, полностью оплачен
  const inv4 = await prisma.invoice.create({
    data: {
      number: "INV-2026-004",
      clientId: client4.id,
      orderId: order4.id,
      issueDate: daysAgo(90),
      dueDate: daysAgo(60),
      subtotal: 60000,
      taxAmount: 0,
      discountAmount: 0,
      total: 60000,
      currency: "TJS",
      status: InvoiceStatus.PAID,
      paidAmount: 60000,
      paidAt: daysAgo(58),
      notes: "Аванс 50% за CRM-систему",
      items: {
        create: [
          { description: "CRM-система — аванс 50%", quantity: 1, unitPrice: 60000, total: 60000, position: 0 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv4.id,
      amount: 60000,
      paymentDate: daysAgo(58),
      paymentMethod: "Банковский перевод",
      reference: "ПП-2026-0245",
    },
  });

  // Invoice 5 — Order 4, просрочен
  const inv5 = await prisma.invoice.create({
    data: {
      number: "INV-2026-005",
      clientId: client4.id,
      orderId: order4.id,
      issueDate: daysAgo(20),
      dueDate: daysAgo(5),
      subtotal: 60000,
      taxAmount: 0,
      discountAmount: 0,
      total: 60000,
      currency: "TJS",
      status: InvoiceStatus.OVERDUE,
      paidAmount: 0,
      notes: "Финальная оплата 50% за CRM-систему",
      items: {
        create: [
          { description: "CRM-система — финал 50%", quantity: 1, unitPrice: 60000, total: 60000, position: 0 },
        ],
      },
    },
  });

  // Invoice 6 — Order 5, полностью оплачен
  const inv6 = await prisma.invoice.create({
    data: {
      number: "INV-2026-006",
      clientId: client5.id,
      orderId: order5.id,
      issueDate: daysAgo(50),
      dueDate: daysAgo(35),
      subtotal: 25000,
      taxAmount: 0,
      discountAmount: 0,
      total: 25000,
      currency: "TJS",
      status: InvoiceStatus.PAID,
      paidAmount: 25000,
      paidAt: daysAgo(33),
      notes: "Полная оплата за лендинг и каталог",
      items: {
        create: [
          { description: "Дизайн лендинга", quantity: 1, unitPrice: 8000, total: 8000, position: 0 },
          { description: "Вёрстка и разработка", quantity: 1, unitPrice: 12000, total: 12000, position: 1 },
          { description: "Каталог продукции", quantity: 1, unitPrice: 5000, total: 5000, position: 2 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv6.id,
      amount: 25000,
      paymentDate: daysAgo(33),
      paymentMethod: "Банковский перевод",
      reference: "ПП-2026-0267",
    },
  });

  // Invoice 7 — Order 2, черновик
  const inv7 = await prisma.invoice.create({
    data: {
      number: "INV-2026-007",
      clientId: client2.id,
      orderId: order2.id,
      issueDate: daysAgo(2),
      dueDate: daysFromNow(28),
      subtotal: 32500,
      taxAmount: 0,
      discountAmount: 0,
      total: 32500,
      currency: "TJS",
      status: InvoiceStatus.DRAFT,
      paidAmount: 0,
      notes: "Аванс 50% за редизайн интернет-магазина",
      items: {
        create: [
          { description: "UX-исследование", quantity: 1, unitPrice: 10000, total: 10000, position: 0 },
          { description: "Дизайн (50%)", quantity: 1, unitPrice: 22500, total: 22500, position: 1 },
        ],
      },
    },
  });

  // Invoice 8 — Order 2, viewed
  const inv8 = await prisma.invoice.create({
    data: {
      number: "INV-2026-008",
      clientId: client2.id,
      orderId: order2.id,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(25),
      subtotal: 32500,
      taxAmount: 0,
      discountAmount: 0,
      total: 32500,
      currency: "TJS",
      status: InvoiceStatus.VIEWED,
      paidAmount: 0,
      notes: "Оплата разработки и интеграций",
      items: {
        create: [
          { description: "Frontend разработка", quantity: 1, unitPrice: 20000, total: 20000, position: 0 },
          { description: "Интеграция платёжных систем", quantity: 1, unitPrice: 12500, total: 12500, position: 1 },
        ],
      },
    },
  });

  // Invoice 9 — Order 1, cancelled
  const inv9 = await prisma.invoice.create({
    data: {
      number: "INV-2026-009",
      clientId: client1.id,
      orderId: order1.id,
      issueDate: daysAgo(15),
      dueDate: daysFromNow(15),
      subtotal: 5000,
      taxAmount: 0,
      discountAmount: 0,
      total: 5000,
      currency: "TJS",
      status: InvoiceStatus.CANCELLED,
      paidAmount: 0,
      notes: "Отменён — пересмотр бюджета",
      items: {
        create: [
          { description: "Дополнительные работы", quantity: 1, unitPrice: 5000, total: 5000, position: 0 },
        ],
      },
    },
  });

  console.log("✅ Счета созданы (9 счетов в разных статусах с платежами)");

  // ==================== COMMENTS ====================
  const commentDefs = [
    // Order 1 comments
    { orderId: order1.id, userId: manager1.id, content: "Клиент утвердил дизайн-макеты. Можно приступать к вёрстке.", isInternal: false },
    { orderId: order1.id, userId: dev1.id, content: "Вёрстка главной страницы завершена. Прошу провести ревью.", isInternal: false },
    { orderId: order1.id, userId: admin.id, content: "Ревью проведено. Есть замечания по адаптиву — исправить до конца недели.", isInternal: true },
    { orderId: order1.id, clientName: "Иван Петров", clientEmail: "ivan@technosoft.tj", content: "Отлично выглядит! Когда можно ожидать личный кабинет?", isInternal: false, isPortalVisible: true },
    { orderId: order1.id, userId: manager1.id, content: "Личный кабинет будет готов к следующей неделе.", isInternal: false, isPortalVisible: true },

    // Order 3 comments
    { orderId: order3.id, userId: dev2.id, content: "Push-уведомления реализованы через Firebase. На ревью.", isInternal: false },
    { orderId: order3.id, userId: manager1.id, content: "Банк просит ускорить тестирование — релиз через 10 дней.", isInternal: true },
    { orderId: order3.id, clientName: "Фаррух Шарипов", clientEmail: "farrukh@eskhata.tj", content: "Протестировали приложение — работает стабильно. Ждём финальную версию.", isInternal: false, isPortalVisible: true },

    // Task comments
    { taskId: "t1-6", userId: dev1.id, content: "Пагинация и сортировка готовы. Осталось сделать фильтры.", isInternal: false },
    { taskId: "t3-7", userId: dev2.id, content: "SQL-инъекции и XSS — тесты пройдены. Осталось CSRF и шифрование.", isInternal: false },
  ];

  for (const c of commentDefs) {
    await prisma.comment.create({ data: c });
  }
  console.log(`✅ Комментарии созданы (${commentDefs.length} комментариев)`);

  // ==================== STATUS HISTORY ====================
  const historyDefs = [
    // Order 1 history
    { orderId: order1.id, fromStatusId: statusMap["new"], toStatusId: statusMap["estimation"], changedById: manager1.id, comment: "Начата оценка проекта" },
    { orderId: order1.id, fromStatusId: statusMap["estimation"], toStatusId: statusMap["proposal_sent"], changedById: manager1.id, comment: "КП отправлено клиенту" },
    { orderId: order1.id, fromStatusId: statusMap["proposal_sent"], toStatusId: statusMap["in_progress"], changedById: manager1.id, comment: "Клиент утвердил, начинаем" },

    // Order 3 history
    { orderId: order3.id, fromStatusId: statusMap["new"], toStatusId: statusMap["estimation"], changedById: manager1.id },
    { orderId: order3.id, fromStatusId: statusMap["estimation"], toStatusId: statusMap["proposal_sent"], changedById: manager1.id },
    { orderId: order3.id, fromStatusId: statusMap["proposal_sent"], toStatusId: statusMap["in_progress"], changedById: manager1.id },
    { orderId: order3.id, fromStatusId: statusMap["in_progress"], toStatusId: statusMap["testing"], changedById: manager1.id, comment: "Основная разработка завершена, переходим к тестированию" },

    // Order 5 history
    { orderId: order5.id, fromStatusId: statusMap["new"], toStatusId: statusMap["in_progress"], changedById: manager1.id },
    { orderId: order5.id, fromStatusId: statusMap["in_progress"], toStatusId: statusMap["testing"], changedById: manager1.id },
    { orderId: order5.id, fromStatusId: statusMap["testing"], toStatusId: statusMap["completed"], changedById: manager1.id, comment: "Лендинг успешно запущен" },
  ];

  for (const h of historyDefs) {
    await prisma.orderStatusHistory.create({ data: h });
  }
  console.log("✅ История статусов созданы");

  console.log("\n🎉 Сидинг завершён успешно!");
  console.log("📊 Создано:");
  console.log("   • 7 пользователей");
  console.log("   • 5 клиентов с контактами");
  console.log("   • 7 заказов в разных статусах");
  console.log("   • 10 этапов");
  console.log(`   • ${taskDefs.length} задач с чеклистами`);
  console.log(`   • ${timeEntryDefs.length} записей времени`);
  console.log("   • 9 счетов с платежами");
  console.log(`   • ${commentDefs.length} комментариев`);
  console.log(`\n🔑 Админ: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error("❌ Ошибка сидинга:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
