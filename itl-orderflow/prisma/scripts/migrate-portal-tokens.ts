import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: { portalEnabled: true, portalToken: { not: null } },
    include: { contacts: { orderBy: { isPrimary: "desc" } } },
  });

  console.log(`Найдено ${clients.length} клиентов с активным старым порталом`);

  for (const client of clients) {
    let ownerContact = client.contacts[0];

    if (!ownerContact) {
      ownerContact = await prisma.clientContact.create({
        data: {
          clientId: client.id,
          firstName: "Владелец",
          isPrimary: true,
          email: client.email,
          phone: client.phone,
        },
      });
      console.log(`  [${client.name}] контактов не было — создан контакт-заглушка "Владелец"`);
    }

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.clientContact.update({
      where: { id: ownerContact.id },
      data: {
        portalEnabled: true,
        portalToken: token,
        canViewProjects: true,
        canViewProposals: true,
        canViewFinance: true,
        canViewDocuments: true,
        canViewTickets: true,
      },
    });

    console.log(
      `  [${client.name}] -> контакт "${ownerContact.firstName}" -> новый токен: ${token}`
    );
  }

  console.log("\nГотово. Старые ссылки клиентов больше не будут работать после удаления Client.portalToken (Task 16) — разошлите клиентам новые персональные ссылки на /portal/login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
