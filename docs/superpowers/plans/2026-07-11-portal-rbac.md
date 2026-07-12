# Portal Role-Based Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move client-portal access from one shared `Client.portalToken` to a per-`ClientContact` token with a section-level permission matrix (Проекты / Предложения / Счета / Документы / Обращения), so different employees of the same client (owner, accountant, operations person, etc.) see only the portal sections they're allowed to.

**Architecture:** `ClientContact` gains its own `portalToken`, `portalEnabled`, and five boolean permission flags. A new `src/lib/portal-session.ts` helper resolves the cookie token to `{ contact, client, permissions }` and gates every `(portal)/portal/**` page; the admin UI on the client detail page gets a per-contact "Доступ в портал" control replacing the old client-level card. A one-off migration script promotes each client's existing shared token to a full-access "owner" contact before the legacy `Client.portalToken`/`portalEnabled` fields are removed.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Prisma 5 (`prisma db push`, no migrations folder), no test runner configured in this repo (no jest/vitest) — verification is via `tsc --noEmit`, `next lint`, and manual smoke testing through the dev server.

**Design doc:** `docs/superpowers/specs/2026-07-11-portal-rbac-design.md`

---

## Important note on task ordering and verification

This repo has no automated test suite, so there are no "write a failing test" steps below — each task's own verification step is a type-check and/or a manual check of the specific file(s) it touches. Because this refactor touches ~17 files that all reference the same session concept, **the full codebase will not type-check cleanly until Task 15 is done** (that's when every consumer of the old `Client.portalToken`/`getPortalClient` has been migrated and the legacy fields are finally removed from the schema). Task 16 is the first point a full `tsc --noEmit` is expected to pass. Commit after every task anyway — these are still meaningful, reviewable checkpoints — just don't be alarmed that `tsc` shows pre-existing-file errors before Task 15.

Tasks are ordered so the legacy `Client.portalToken` / `Client.portalEnabled` fields stay in the schema (unused by new code, but present) until every consumer has been migrated off them, keeping `prisma db push` safe to run at each schema-touching step.

---

### Task 1: Add portal fields to `ClientContact`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the new fields to the `ClientContact` model**

Find this block in `prisma/schema.prisma`:

```prisma
model ClientContact {
  id            String    @id @default(cuid())

  clientId      String
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  firstName     String
  lastName      String?
  position      String?
  email         String?
  phone         String?
  telegram      String?

  isPrimary     Boolean   @default(false)
  isDecisionMaker Boolean @default(false)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([clientId])
}
```

Replace it with:

```prisma
model ClientContact {
  id            String    @id @default(cuid())

  clientId      String
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  firstName     String
  lastName      String?
  position      String?
  email         String?
  phone         String?
  telegram      String?

  isPrimary     Boolean   @default(false)
  isDecisionMaker Boolean @default(false)

  // Portal access
  portalEnabled     Boolean  @default(false)
  portalToken       String?  @unique
  canViewProjects   Boolean  @default(false)
  canViewProposals  Boolean  @default(false)
  canViewFinance    Boolean  @default(false)
  canViewDocuments  Boolean  @default(false)
  canViewTickets    Boolean  @default(false)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([clientId])
  @@index([portalToken])
}
```

- [ ] **Step 2: Push the schema change and regenerate the Prisma client**

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.` followed by a successful `prisma generate` run (Prisma 5 runs generate automatically after `db push`).

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add per-contact portal access fields to ClientContact"
```

---

### Task 2: Migration script for existing client-level tokens

**Files:**
- Create: `prisma/scripts/migrate-portal-tokens.ts`

- [ ] **Step 1: Write the migration script**

```typescript
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
```

- [ ] **Step 2: Run the migration script against the dev database**

Run: `npx tsx prisma/scripts/migrate-portal-tokens.ts`
Expected: `Найдено N клиентов с активным старым порталом` (N may be 0 in a fresh dev database — that's fine), followed by one line per migrated client and the "Готово." message. No errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/scripts/migrate-portal-tokens.ts
git commit -m "feat: add one-off migration script for legacy client portal tokens"
```

---

### Task 3: Portal permission constants and session helper

**Files:**
- Create: `src/lib/portal-permissions.ts`
- Create: `src/lib/portal-session.ts`

- [ ] **Step 1: Create the shared permission constants (safe to import from client components)**

```typescript
// src/lib/portal-permissions.ts
export type PortalPermissionKey =
  | "canViewProjects"
  | "canViewProposals"
  | "canViewFinance"
  | "canViewDocuments"
  | "canViewTickets";

export const PORTAL_SECTIONS: { key: PortalPermissionKey; label: string }[] = [
  { key: "canViewProjects", label: "Проекты" },
  { key: "canViewProposals", label: "Предложения" },
  { key: "canViewFinance", label: "Счета" },
  { key: "canViewDocuments", label: "Документы" },
  { key: "canViewTickets", label: "Обращения" },
];
```

This file has no `next/headers` or `prisma` imports so it's safe to import from both server and `"use client"` components (the admin permission-editing UI in Task 14 needs it client-side).

- [ ] **Step 2: Create the server-only portal session helper**

```typescript
// src/lib/portal-session.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PortalPermissionKey } from "@/lib/portal-permissions";

export interface PortalSession {
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    position: string | null;
  };
  client: {
    id: string;
    name: string;
    email: string | null;
  };
  permissions: Record<PortalPermissionKey, boolean>;
}

export async function getPortalSession(token: string): Promise<PortalSession | null> {
  const contact = await prisma.clientContact.findFirst({
    where: {
      portalToken: token,
      portalEnabled: true,
      client: { isArchived: false },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      canViewProjects: true,
      canViewProposals: true,
      canViewFinance: true,
      canViewDocuments: true,
      canViewTickets: true,
      client: { select: { id: true, name: true, email: true } },
    },
  });

  if (!contact) return null;

  return {
    contact: {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      position: contact.position,
    },
    client: contact.client,
    permissions: {
      canViewProjects: contact.canViewProjects,
      canViewProposals: contact.canViewProposals,
      canViewFinance: contact.canViewFinance,
      canViewDocuments: contact.canViewDocuments,
      canViewTickets: contact.canViewTickets,
    },
  };
}

export async function requirePortalSession(
  permission?: PortalPermissionKey
): Promise<PortalSession> {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;
  if (!token) redirect("/portal/login");

  const session = await getPortalSession(token);
  if (!session) redirect("/portal/login");

  if (permission && !session.permissions[permission]) {
    redirect("/portal?denied=1");
  }

  return session;
}

// Used by automatic email notifications (see src/actions/notifications.ts) to pick
// which contact should receive a transactional email for a given portal section.
export async function findPortalContactForNotification(
  clientId: string,
  permission: PortalPermissionKey
) {
  return prisma.clientContact.findFirst({
    where: {
      clientId,
      portalEnabled: true,
      email: { not: null },
      ...({ [permission]: true } as Record<PortalPermissionKey, boolean>),
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, email: true, portalToken: true, firstName: true },
  });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors reported for `src/lib/portal-permissions.ts` or `src/lib/portal-session.ts` (errors in files not yet migrated, like `src/actions/portal.ts`, are expected at this point — see the note at the top of this plan).

- [ ] **Step 4: Commit**

```bash
git add src/lib/portal-permissions.ts src/lib/portal-session.ts
git commit -m "feat: add portal session/permission resolver for per-contact access"
```

---

### Task 4: Rewrite `src/actions/portal.ts` for per-contact access

**Files:**
- Modify: `src/actions/portal.ts`

- [ ] **Step 1: Remove `getPortalClient` and add the new imports**

Replace:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createNotificationForUsers, getOrderNotificationRecipients } from "@/lib/notifications";

// Validate portal token and get client
export async function getPortalClient(token: string) {
  const client = await prisma.client.findFirst({
    where: {
      portalToken: token,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      portalToken: true,
    },
  });

  return client;
}
```

with:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createNotificationForUsers, getOrderNotificationRecipients } from "@/lib/notifications";
import { requireAuth } from "@/lib/auth-guard";
import { formatDate } from "@/lib/utils";
```

- [ ] **Step 2: Make `getPortalDashboard` permission-aware**

Replace:

```typescript
// Get portal dashboard data
export async function getPortalDashboard(clientId: string) {
  const [orders, invoices, proposals] = await Promise.all([
    prisma.order.findMany({
      where: { clientId },
      include: {
        status: true,
        tasks: { select: { status: true } },
        milestones: {
          select: {
            tasks: { select: { status: true } },
          },
        },
        _count: { select: { tasks: true, milestones: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.proposal.findMany({
      where: {
        clientId,
        status: { not: "DRAFT" },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
```

with:

```typescript
// Get portal dashboard data (only queries sections the contact can see)
export async function getPortalDashboard(
  clientId: string,
  permissions: { canViewProjects: boolean; canViewProposals: boolean; canViewFinance: boolean }
) {
  const orders = permissions.canViewProjects
    ? await prisma.order.findMany({
        where: { clientId },
        include: {
          status: true,
          tasks: { select: { status: true } },
          milestones: {
            select: {
              tasks: { select: { status: true } },
            },
          },
          _count: { select: { tasks: true, milestones: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const invoices = permissions.canViewFinance
    ? await prisma.invoice.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const proposals = permissions.canViewProposals
    ? await prisma.proposal.findMany({
        where: {
          clientId,
          status: { not: "DRAFT" },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];
```

Leave the rest of the function (the stats calculation and `return { ... }` block) exactly as-is — it already works off the `orders`/`invoices`/`proposals` local variables.

- [ ] **Step 3: Add `getPortalDocuments`**

Add this new function directly after `getPortalOrder` (right before `// Add portal comment`):

```typescript
// Get portal documents: contracts, amendments, tech specs, reconciliation acts
export type PortalDocumentType = "CONTRACT" | "AMENDMENT" | "TECH_SPEC" | "RECONCILIATION";

export interface PortalDocument {
  id: string;
  type: PortalDocumentType;
  number: string;
  title: string;
  date: Date;
  status: string;
  pdfUrl: string | null;
}

export async function getPortalDocuments(clientId: string): Promise<PortalDocument[]> {
  const [contracts, techSpecs, reconciliations] = await Promise.all([
    prisma.contract.findMany({
      where: { clientId },
      include: { amendments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.techSpec.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reconciliation.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const documents: PortalDocument[] = [
    ...contracts.map((c) => ({
      id: c.id,
      type: "CONTRACT" as const,
      number: c.number,
      title: c.title,
      date: c.contractDate,
      status: c.status,
      pdfUrl: c.generatedPdfUrl,
    })),
    ...contracts.flatMap((c) =>
      c.amendments.map((a) => ({
        id: a.id,
        type: "AMENDMENT" as const,
        number: a.number,
        title: a.title,
        date: a.effectiveDate,
        status: a.status,
        pdfUrl: a.generatedPdfUrl,
      }))
    ),
    ...techSpecs.map((t) => ({
      id: t.id,
      type: "TECH_SPEC" as const,
      number: t.number,
      title: t.title,
      date: t.approvedDate ?? t.createdAt,
      status: t.status,
      pdfUrl: t.generatedPdfUrl,
    })),
    ...reconciliations.map((r) => ({
      id: r.id,
      type: "RECONCILIATION" as const,
      number: r.number,
      title: `Акт сверки за период ${formatDate(r.periodFrom)} — ${formatDate(r.periodTo)}`,
      date: r.generatedDate,
      status: r.status,
      pdfUrl: r.generatedPdfUrl,
    })),
  ];

  documents.sort((a, b) => b.date.getTime() - a.date.getTime());

  return documents;
}
```

- [ ] **Step 4: Replace `generatePortalToken` with the three per-contact admin actions**

Replace:

```typescript
// Generate portal token for a client
export async function generatePortalToken(clientId: string) {
  try {
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.client.update({
      where: { id: clientId },
      data: { portalToken: token },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, token };
  } catch (error) {
    console.error("Error generating portal token:", error);
    return { error: "Ошибка при генерации токена" };
  }
}
```

with:

```typescript
// Generate (or regenerate) a portal token for one client contact
export async function generateContactPortalToken(contactId: string, clientId: string) {
  await requireAuth();
  try {
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.clientContact.update({
      where: { id: contactId },
      data: { portalToken: token },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, token };
  } catch (error) {
    console.error("Error generating contact portal token:", error);
    return { error: "Ошибка при генерации токена" };
  }
}

// Update a contact's portal enabled flag and section permissions
export async function updateContactPortalPermissions(
  contactId: string,
  clientId: string,
  data: {
    portalEnabled: boolean;
    canViewProjects: boolean;
    canViewProposals: boolean;
    canViewFinance: boolean;
    canViewDocuments: boolean;
    canViewTickets: boolean;
  }
) {
  await requireAuth();
  try {
    await prisma.clientContact.update({
      where: { id: contactId },
      data,
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating contact portal permissions:", error);
    return { error: "Ошибка при обновлении прав доступа" };
  }
}

// Turn off portal access without clearing permissions (so re-enabling restores them)
export async function revokeContactPortalAccess(contactId: string, clientId: string) {
  await requireAuth();
  try {
    await prisma.clientContact.update({
      where: { id: contactId },
      data: { portalEnabled: false },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error revoking contact portal access:", error);
    return { error: "Ошибка при отзыве доступа" };
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/portal.ts
git commit -m "feat: move portal token/permission actions to ClientContact"
```

---

### Task 5: Update automatic email notifications to use per-contact tokens

**Files:**
- Modify: `src/actions/notifications.ts`
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Import the new lookup helper and drop the now-unused `portalTokenEmail` import**

Replace:

```typescript
import { auth } from "@/lib/auth";
import {
  sendEmail,
  invoiceSentEmail,
  orderStatusEmail,
  milestoneReadyEmail,
  portalTokenEmail,
} from "@/lib/email";
```

with:

```typescript
import { auth } from "@/lib/auth";
import {
  sendEmail,
  invoiceSentEmail,
  orderStatusEmail,
  milestoneReadyEmail,
} from "@/lib/email";
import { findPortalContactForNotification } from "@/lib/portal-session";
```

- [ ] **Step 2: Update `sendInvoiceNotification` to email the finance contact**

Replace:

```typescript
export async function sendInvoiceNotification(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        order: true,
      },
    });

    if (!invoice || !invoice.client?.email) {
      return { error: "Счёт или email клиента не найден" };
    }

    const { subject, html } = invoiceSentEmail({
      clientName: invoice.client.name,
      invoiceNumber: invoice.number,
      amount: `${Number(invoice.total)} ${invoice.currency}`,
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("ru-RU")
        : "Не указан",
      portalUrl: invoice.client.portalToken
        ? `${getBaseUrl()}/portal/login?token=${invoice.client.portalToken}`
        : undefined,
    });

    const result = await sendEmail({
      to: invoice.client.email,
      subject,
      html,
    });

    if (result.error) return { error: result.error };

    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    });

    return { success: true };
  } catch (error) {
    log.error("Error sending invoice notification", error);
    return { error: "Ошибка при отправке" };
  }
}
```

with:

```typescript
export async function sendInvoiceNotification(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        order: true,
      },
    });

    if (!invoice) {
      return { error: "Счёт не найден" };
    }

    const contact = await findPortalContactForNotification(invoice.clientId, "canViewFinance");
    if (!contact?.email) {
      return { error: "Контакт с доступом к разделу «Счета» и email не найден" };
    }

    const { subject, html } = invoiceSentEmail({
      clientName: invoice.client.name,
      invoiceNumber: invoice.number,
      amount: `${Number(invoice.total)} ${invoice.currency}`,
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("ru-RU")
        : "Не указан",
      portalUrl: contact.portalToken
        ? `${getBaseUrl()}/portal/login?token=${contact.portalToken}`
        : undefined,
    });

    const result = await sendEmail({
      to: contact.email,
      subject,
      html,
    });

    if (result.error) return { error: result.error };

    // Update invoice status to SENT
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    });

    return { success: true };
  } catch (error) {
    log.error("Error sending invoice notification", error);
    return { error: "Ошибка при отправке" };
  }
}
```

- [ ] **Step 3: Update `sendOrderStatusNotification` to email the projects contact**

Replace:

```typescript
export async function sendOrderStatusNotification(
  orderId: string,
  newStatusName: string
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        status: true,
      },
    });

    if (!order || !order.client?.email) return;
    if (!order.status?.notifyClient) return;

    const { subject, html } = orderStatusEmail({
      clientName: order.client.name,
      orderNumber: order.number,
      orderTitle: order.title,
      newStatus: newStatusName,
      portalUrl: order.client.portalToken
        ? `${getBaseUrl()}/portal/login?token=${order.client.portalToken}`
        : undefined,
    });

    await sendEmail({ to: order.client.email, subject, html });
  } catch (error) {
    log.error("Error sending order status notification", error);
  }
}
```

with:

```typescript
export async function sendOrderStatusNotification(
  orderId: string,
  newStatusName: string
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        status: true,
      },
    });

    if (!order) return;
    if (!order.status?.notifyClient) return;

    const contact = await findPortalContactForNotification(order.clientId, "canViewProjects");
    if (!contact?.email) return;

    const { subject, html } = orderStatusEmail({
      clientName: order.client.name,
      orderNumber: order.number,
      orderTitle: order.title,
      newStatus: newStatusName,
      portalUrl: contact.portalToken
        ? `${getBaseUrl()}/portal/login?token=${contact.portalToken}`
        : undefined,
    });

    await sendEmail({ to: contact.email, subject, html });
  } catch (error) {
    log.error("Error sending order status notification", error);
  }
}
```

- [ ] **Step 4: Update `sendMilestoneReadyNotification` to email the projects contact**

Replace:

```typescript
export async function sendMilestoneReadyNotification(milestoneId: string) {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        order: {
          include: { client: true },
        },
      },
    });

    if (!milestone || !milestone.order?.client?.email) return;

    const client = milestone.order.client;

    const { subject, html } = milestoneReadyEmail({
      clientName: client.name,
      orderNumber: milestone.order.number,
      milestoneTitle: milestone.title,
      portalUrl: client.portalToken
        ? `${getBaseUrl()}/portal/orders/${milestone.orderId}`
        : undefined,
    });

    await sendEmail({ to: client.email || "", subject, html });
  } catch (error) {
    log.error("Error sending milestone notification", error);
  }
}
```

with:

```typescript
export async function sendMilestoneReadyNotification(milestoneId: string) {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        order: {
          include: { client: true },
        },
      },
    });

    if (!milestone) return;

    const contact = await findPortalContactForNotification(
      milestone.order.clientId,
      "canViewProjects"
    );
    if (!contact?.email) return;

    const { subject, html } = milestoneReadyEmail({
      clientName: milestone.order.client.name,
      orderNumber: milestone.order.number,
      milestoneTitle: milestone.title,
      portalUrl: `${getBaseUrl()}/portal/orders/${milestone.orderId}`,
    });

    await sendEmail({ to: contact.email, subject, html });
  } catch (error) {
    log.error("Error sending milestone notification", error);
  }
}
```

- [ ] **Step 5: Delete the unused `sendPortalAccessEmail` function**

This function has zero call sites in the codebase (verified via `grep -rn "sendPortalAccessEmail" src` — only its own definition matches) and references the removed `Client.portalToken` field, so delete it rather than fix it. Remove this whole block:

```typescript
// Send portal access link to client
export async function sendPortalAccessEmail(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client?.email || !client.portalToken) {
      return { error: "Email или токен клиента не найден" };
    }

    const { subject, html } = portalTokenEmail({
      clientName: client.name,
      portalUrl: `${getBaseUrl()}/portal/login?token=${client.portalToken}`,
    });

    const result = await sendEmail({ to: client.email, subject, html });

    if (result.error) return { error: result.error };
    return { success: true };
  } catch (error) {
    log.error("Error sending portal access email", error);
    return { error: "Ошибка при отправке" };
  }
}
```

- [ ] **Step 6: Remove the now-unused `portalTokenEmail` helper from `src/lib/email.ts`**

Delete this function from `src/lib/email.ts` (it has no remaining callers after Step 5):

```typescript
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
```

- [ ] **Step 7: Commit**

```bash
git add src/actions/notifications.ts src/lib/email.ts
git commit -m "feat: send transactional portal emails to the relevant contact, not the client"
```

---

### Task 6: Update `/api/portal/auth` route

**Files:**
- Modify: `src/app/api/portal/auth/route.ts`

- [ ] **Step 1: Swap `getPortalClient` for `getPortalSession`**

Replace the whole file with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPortalSession } from "@/lib/portal-session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rl = rateLimit(`portal-auth:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток. Повторите позже." },
        { status: 429 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Токен обязателен" }, { status: 400 });
    }

    const session = await getPortalSession(token);

    if (!session) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
    }

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set("portal_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return NextResponse.json({ success: true, client: { name: session.client.name } });
  } catch (error) {
    console.error("Portal auth error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("portal_token");
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/portal/auth/route.ts
git commit -m "feat: resolve portal login token against ClientContact"
```

---

### Task 7: Update the portal layout (nav gating + empty-access state)

**Files:**
- Modify: `src/app/(portal)/layout.tsx`

- [ ] **Step 1: Replace the whole file**

```tsx
import Link from "next/link";
import { Building2, FolderKanban, FileText, ScrollText, MessageCircle, FileStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requirePortalSession } from "@/lib/portal-session";
import { PORTAL_SECTIONS, PortalPermissionKey } from "@/lib/portal-permissions";
import { PortalLogoutButton } from "@/components/portal-logout-button";

const ICONS: Record<PortalPermissionKey, any> = {
  canViewProjects: FolderKanban,
  canViewProposals: ScrollText,
  canViewFinance: FileText,
  canViewDocuments: FileStack,
  canViewTickets: MessageCircle,
};

const HREFS: Record<PortalPermissionKey, string> = {
  canViewProjects: "/portal",
  canViewProposals: "/portal/proposals",
  canViewFinance: "/portal/invoices",
  canViewDocuments: "/portal/documents",
  canViewTickets: "/portal/tickets",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePortalSession();

  const navItems = PORTAL_SECTIONS.filter((section) => session.permissions[section.key]).map(
    (section) => ({
      ...section,
      icon: ICONS[section.key],
      href: HREFS[section.key],
    })
  );
  const hasAnyAccess = navItems.length > 0;

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-[#dbdfe6] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/portal" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">ITL Solutions</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block text-right">
                <p className="font-medium text-foreground">{session.client.name}</p>
                <p className="text-xs">
                  {session.contact.firstName} {session.contact.lastName}
                  {session.contact.position ? ` · ${session.contact.position}` : ""}
                </p>
              </div>
              <PortalLogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasAnyAccess ? (
          children
        ) : (
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-12 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Доступ не настроен</p>
            <p className="text-sm mt-1">
              Обратитесь к вашему менеджеру, чтобы включить нужные разделы портала.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(portal)/layout.tsx"
git commit -m "feat: gate portal navigation by contact permissions"
```

---

### Task 8: Update the portal dashboard page

**Files:**
- Modify: `src/app/(portal)/portal/page.tsx`

- [ ] **Step 1: Replace the whole file**

```tsx
import Link from "next/link";
import { getPortalDashboard } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  Clock,
  DollarSign,
  FileText,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: { denied?: string };
}) {
  const session = await requirePortalSession();
  const { permissions } = session;

  const { orders, invoices, proposals, pendingProposals, stats } = await getPortalDashboard(
    session.client.id,
    {
      canViewProjects: permissions.canViewProjects,
      canViewProposals: permissions.canViewProposals,
      canViewFinance: permissions.canViewFinance,
    }
  );

  return (
    <div className="space-y-8">
      {searchParams.denied && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">
          У вас нет доступа к этому разделу. Обратитесь к вашему менеджеру.
        </div>
      )}

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Добро пожаловать, {session.contact.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Отслеживайте прогресс ваших проектов
        </p>
      </div>

      {/* Stats */}
      {(permissions.canViewProjects || permissions.canViewFinance) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {permissions.canViewProjects && (
            <>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">Проектов</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeCount}</p>
                    <p className="text-sm text-muted-foreground">Активных</p>
                  </div>
                </div>
              </div>
            </>
          )}
          {permissions.canViewFinance && (
            <>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.totalInvoiced)}
                    </p>
                    <p className="text-sm text-muted-foreground">Выставлено</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.outstanding)}
                    </p>
                    <p className="text-sm text-muted-foreground">К оплате</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Projects */}
      {permissions.canViewProjects && (
        <div>
          <h2 className="text-lg font-bold mb-4">Ваши проекты</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order: any) => {
              const allTasks = [
                ...(order.tasks || []),
                ...(order.milestones?.flatMap((m: any) => m.tasks || []) || []),
              ];
              const doneTasks = allTasks.filter((t: any) => t.status === "DONE").length;
              const totalTasks = allTasks.length;
              const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
              const isCompleted = order.status?.code === "completed";

              return (
                <Link key={order.id} href={`/portal/orders/${order.id}`}>
                  <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {order.number}
                        </span>
                        <h3 className="font-medium mt-0.5">{order.title}</h3>
                      </div>
                      {order.status && (
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                          style={{
                            backgroundColor: order.status.color + "10",
                            color: order.status.color,
                            borderColor: order.status.color + "40",
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: order.status.color }} />
                          {order.status.name}
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-3">
                      <Progress value={progressPercent} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-10 text-right">{progressPercent}%</span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {order.deadline && (
                        <span>Дедлайн: {formatDate(order.deadline)}</span>
                      )}
                      <span>{doneTasks}/{totalTasks} задач</span>
                      <span>{order._count?.milestones || 0} этапов</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="text-sm">
                        {isCompleted ? "Завершён" : "В работе"}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
            {orders.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-12 text-center text-muted-foreground">
                <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Проектов пока нет</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Proposals */}
      {permissions.canViewProposals && proposals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              Коммерческие предложения
              {pendingProposals > 0 && (
                <Badge variant="default" className="ml-2">
                  {pendingProposals} новых
                </Badge>
              )}
            </h2>
            <Link
              href="/portal/proposals"
              className="text-sm text-primary hover:underline"
            >
              Все предложения
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dbdfe6] bg-background-light">
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Название
                  </th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p: any) => {
                  const proposalStatusDots: Record<string, { label: string; dot: string }> = {
                    SENT: { label: "Новое", dot: "#3b82f6" },
                    VIEWED: { label: "Просмотрено", dot: "#8b5cf6" },
                    ACCEPTED: { label: "Принято", dot: "#22c55e" },
                    REJECTED: { label: "Отклонено", dot: "#ef4444" },
                    EXPIRED: { label: "Истекло", dot: "#f59e0b" },
                  };
                  const st = proposalStatusDots[p.status] || proposalStatusDots.SENT;
                  return (
                    <tr key={p.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors">
                      <td className="py-3 px-5">
                        <Link
                          href={`/portal/proposals/${p.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {p.number}
                        </Link>
                      </td>
                      <td className="py-3 px-5">{p.title}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                          <span className="text-sm">{st.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-medium">
                        {formatCurrency(p.totalAmount, p.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {permissions.canViewFinance && invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Последние счета</h2>
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dbdfe6] bg-background-light">
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
                  <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const invoiceStatusDots: Record<string, { label: string; dot: string }> = {
                    DRAFT: { label: "Черновик", dot: "#9ca3af" },
                    SENT: { label: "Отправлен", dot: "#3b82f6" },
                    PAID: { label: "Оплачен", dot: "#22c55e" },
                    PARTIALLY_PAID: { label: "Частично", dot: "#f59e0b" },
                    OVERDUE: { label: "Просрочен", dot: "#ef4444" },
                  };
                  const st = invoiceStatusDots[inv.status] || invoiceStatusDots.DRAFT;
                  return (
                    <tr key={inv.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors">
                      <td className="py-3 px-5 font-mono">{inv.number}</td>
                      <td className="py-3 px-5">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                          <span className="text-sm">{st.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-medium">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(portal)/portal/page.tsx"
git commit -m "feat: gate portal dashboard sections by contact permissions"
```

---

### Task 9: Update the order detail portal page

**Files:**
- Modify: `src/app/(portal)/portal/orders/[id]/page.tsx`

- [ ] **Step 1: Swap the auth block and imports**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalOrder } from "@/actions/portal";
```

with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPortalOrder } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
```

Then replace:

```tsx
export default async function PortalOrderPage({ params }: PortalOrderPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const order = await getPortalOrder(client.id, params.id);
```

with:

```tsx
export default async function PortalOrderPage({ params }: PortalOrderPageProps) {
  const session = await requirePortalSession("canViewProjects");
  const { client } = session;

  const order = await getPortalOrder(client.id, params.id);
```

The rest of the file (which references `client.id` / `client.name` further down for `MilestoneApproveButton` and `PortalCommentForm`) needs no other changes since `client` is still in scope with the same shape.

- [ ] **Step 2: Commit**

```bash
git add "src/app/(portal)/portal/orders/[id]/page.tsx"
git commit -m "feat: gate portal order detail page by canViewProjects"
```

---

### Task 10: Update the proposals portal pages

**Files:**
- Modify: `src/app/(portal)/portal/proposals/page.tsx`
- Modify: `src/app/(portal)/portal/proposals/[id]/page.tsx`

- [ ] **Step 1: Update the proposals list page**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalProposals } from "@/actions/portal";
```

with:

```tsx
import Link from "next/link";
import { getPortalProposals } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
```

Then replace:

```tsx
export default async function PortalProposalsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const proposals = await getPortalProposals(client.id);
```

with:

```tsx
export default async function PortalProposalsPage() {
  const session = await requirePortalSession("canViewProposals");
  const { client } = session;

  const proposals = await getPortalProposals(client.id);
```

- [ ] **Step 2: Update the proposal detail page**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalProposal } from "@/actions/portal";
```

with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPortalProposal } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
```

Then replace:

```tsx
export default async function PortalProposalPage({
  params,
}: PortalProposalPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const [proposal, settings] = await Promise.all([
    getPortalProposal(client.id, params.id),
    getSettings(),
  ]);
```

with:

```tsx
export default async function PortalProposalPage({
  params,
}: PortalProposalPageProps) {
  const session = await requirePortalSession("canViewProposals");
  const { client } = session;

  const [proposal, settings] = await Promise.all([
    getPortalProposal(client.id, params.id),
    getSettings(),
  ]);
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(portal)/portal/proposals/page.tsx" "src/app/(portal)/portal/proposals/[id]/page.tsx"
git commit -m "feat: gate portal proposal pages by canViewProposals"
```

---

### Task 11: Update the invoices portal page

**Files:**
- Modify: `src/app/(portal)/portal/invoices/page.tsx`

- [ ] **Step 1: Swap the auth block and imports**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/actions/portal";
import { prisma } from "@/lib/prisma";
```

with:

```tsx
import { prisma } from "@/lib/prisma";
import { requirePortalSession } from "@/lib/portal-session";
```

Then replace:

```tsx
export default async function PortalInvoicesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const invoices = await prisma.invoice.findMany({
```

with:

```tsx
export default async function PortalInvoicesPage() {
  const session = await requirePortalSession("canViewFinance");
  const { client } = session;

  const invoices = await prisma.invoice.findMany({
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(portal)/portal/invoices/page.tsx"
git commit -m "feat: gate portal invoices page by canViewFinance"
```

---

### Task 12: Update the tickets portal pages

**Files:**
- Modify: `src/app/(portal)/portal/tickets/page.tsx`
- Modify: `src/app/(portal)/portal/tickets/[id]/page.tsx`
- Modify: `src/app/(portal)/portal/tickets/new/page.tsx`

- [ ] **Step 1: Update the tickets list page**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient } from "@/actions/portal";
import { getPortalTickets } from "@/actions/tickets";
```

with:

```tsx
import Link from "next/link";
import { getPortalTickets } from "@/actions/tickets";
import { requirePortalSession } from "@/lib/portal-session";
```

Then replace:

```tsx
export default async function PortalTicketsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const { tickets, stats } = await getPortalTickets(client.id);
```

with:

```tsx
export default async function PortalTicketsPage() {
  const session = await requirePortalSession("canViewTickets");
  const { client } = session;

  const { tickets, stats } = await getPortalTickets(client.id);
```

- [ ] **Step 2: Update the ticket detail page**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalClient } from "@/actions/portal";
import { getPortalTicket } from "@/actions/tickets";
```

with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPortalTicket } from "@/actions/tickets";
import { requirePortalSession } from "@/lib/portal-session";
```

Then replace:

```tsx
export default async function PortalTicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const ticket = await getPortalTicket(client.id, params.id);
```

with:

```tsx
export default async function PortalTicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requirePortalSession("canViewTickets");
  const { client } = session;

  const ticket = await getPortalTicket(client.id, params.id);
```

- [ ] **Step 3: Update the new-ticket page**

Replace:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/actions/portal";
import { getPortalOrders } from "@/actions/tickets";
import { PortalTicketForm } from "@/components/portal/ticket-form";

export default async function PortalNewTicketPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const orders = await getPortalOrders(client.id);
```

with:

```tsx
import { getPortalOrders } from "@/actions/tickets";
import { PortalTicketForm } from "@/components/portal/ticket-form";
import { requirePortalSession } from "@/lib/portal-session";

export default async function PortalNewTicketPage() {
  const session = await requirePortalSession("canViewTickets");
  const { client } = session;

  const orders = await getPortalOrders(client.id);
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(portal)/portal/tickets"
git commit -m "feat: gate portal ticket pages by canViewTickets"
```

---

### Task 13: New portal documents page

**Files:**
- Create: `src/app/(portal)/portal/documents/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { getPortalDocuments } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
import { FileStack, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  CONTRACT: "Договор",
  AMENDMENT: "Доп. соглашение",
  TECH_SPEC: "Техническое задание",
  RECONCILIATION: "Акт сверки",
};

const statusDots: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  ACTIVE: { label: "Действует", dot: "#22c55e" },
  COMPLETED: { label: "Завершён", dot: "#3b82f6" },
  TERMINATED: { label: "Расторгнут", dot: "#ef4444" },
  EXPIRED: { label: "Истёк", dot: "#f59e0b" },
  REVIEW: { label: "На согласовании", dot: "#8b5cf6" },
  APPROVED: { label: "Утверждён", dot: "#22c55e" },
  ARCHIVED: { label: "В архиве", dot: "#9ca3af" },
  SENT: { label: "Отправлен", dot: "#3b82f6" },
  CONFIRMED: { label: "Подтверждён", dot: "#22c55e" },
};

export default async function PortalDocumentsPage() {
  const session = await requirePortalSession("canViewDocuments");
  const documents = await getPortalDocuments(session.client.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Документы</h1>
        <p className="text-muted-foreground mt-1">
          Договоры, техзадания, допсоглашения и акты сверки
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#dbdfe6] bg-background-light">
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Тип</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Название</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Файл</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const st = statusDots[doc.status] || { label: doc.status, dot: "#9ca3af" };
              return (
                <tr
                  key={`${doc.type}-${doc.id}`}
                  className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors"
                >
                  <td className="py-3 px-5 font-mono">{doc.number}</td>
                  <td className="py-3 px-5">{typeLabels[doc.type]}</td>
                  <td className="py-3 px-5">{doc.title}</td>
                  <td className="py-3 px-5">{formatDate(doc.date)}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                      <span className="text-sm">{st.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right">
                    {doc.pdfUrl ? (
                      <a
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {documents.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <FileStack className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Документов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(portal)/portal/documents/page.tsx"
git commit -m "feat: add portal Documents section gated by canViewDocuments"
```

---

### Task 14: Admin UI — per-contact portal access component

**Files:**
- Create: `src/components/clients/contact-portal-access.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Loader2, RefreshCw, Key } from "lucide-react";
import {
  generateContactPortalToken,
  updateContactPortalPermissions,
  revokeContactPortalAccess,
} from "@/actions/portal";
import { PORTAL_SECTIONS, PortalPermissionKey } from "@/lib/portal-permissions";

interface ContactPortalAccessProps {
  clientId: string;
  contact: {
    id: string;
    portalEnabled: boolean;
    portalToken: string | null;
    canViewProjects: boolean;
    canViewProposals: boolean;
    canViewFinance: boolean;
    canViewDocuments: boolean;
    canViewTickets: boolean;
  };
}

type Permissions = Record<PortalPermissionKey, boolean>;

export function ContactPortalAccess({ clientId, contact }: ContactPortalAccessProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"token" | "link" | null>(null);
  const [token, setToken] = useState(contact.portalToken);
  const [enabled, setEnabled] = useState(contact.portalEnabled);
  const [permissions, setPermissions] = useState<Permissions>({
    canViewProjects: contact.canViewProjects,
    canViewProposals: contact.canViewProposals,
    canViewFinance: contact.canViewFinance,
    canViewDocuments: contact.canViewDocuments,
    canViewTickets: contact.canViewTickets,
  });

  const portalLoginUrl =
    typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "/portal/login";

  function savePermissions(next: Permissions, nextEnabled: boolean) {
    startTransition(async () => {
      const result = await updateContactPortalPermissions(contact.id, clientId, {
        portalEnabled: nextEnabled,
        ...next,
      });
      if (result.error) alert(result.error);
      router.refresh();
    });
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    savePermissions(permissions, next);
  }

  function togglePermission(key: PortalPermissionKey) {
    const next = { ...permissions, [key]: !permissions[key] };
    setPermissions(next);
    savePermissions(next, enabled);
  }

  function grantFullAccess() {
    const next: Permissions = {
      canViewProjects: true,
      canViewProposals: true,
      canViewFinance: true,
      canViewDocuments: true,
      canViewTickets: true,
    };
    setPermissions(next);
    setEnabled(true);
    savePermissions(next, true);
  }

  function handleGenerateToken() {
    startTransition(async () => {
      const result = await generateContactPortalToken(contact.id, clientId);
      if (result.success && result.token) {
        setToken(result.token);
      } else if (result.error) {
        alert(result.error);
      }
      router.refresh();
    });
  }

  function handleRevoke() {
    setEnabled(false);
    startTransition(async () => {
      const result = await revokeContactPortalAccess(contact.id, clientId);
      if (result.error) alert(result.error);
      router.refresh();
    });
  }

  function handleCopy(text: string, type: "token" | "link") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#dbdfe6] space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
          <Checkbox checked={enabled} onCheckedChange={toggleEnabled} disabled={isPending} />
          Доступ в портал
          {enabled && <Badge className="bg-green-100 text-green-700">Включён</Badge>}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={grantFullAccess} disabled={isPending}>
          Полный доступ
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PORTAL_SECTIONS.map((section) => (
          <label key={section.key} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox
              checked={permissions[section.key]}
              onCheckedChange={() => togglePermission(section.key)}
              disabled={isPending}
            />
            {section.label}
          </label>
        ))}
      </div>

      {token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={token} className="font-mono text-xs bg-gray-50" />
            <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => handleCopy(token, "token")}>
              {copied === "token" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input readOnly value={portalLoginUrl} className="text-xs bg-gray-50" />
            <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => handleCopy(portalLoginUrl, "link")}>
              {copied === "link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateToken} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Перегенерировать токен
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRevoke}
              disabled={isPending}
            >
              Отозвать доступ
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={handleGenerateToken} disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
          Сгенерировать токен
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors reported for `src/components/clients/contact-portal-access.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/clients/contact-portal-access.tsx
git commit -m "feat: add per-contact portal access admin component"
```

---

### Task 15: Wire the new component into the client detail page and remove the old one

**Files:**
- Modify: `src/app/(dashboard)/clients/[id]/page.tsx`
- Delete: `src/components/clients/portal-access.tsx`

- [ ] **Step 1: Swap the import**

Replace:

```tsx
import { ClientActions } from "@/components/clients/client-actions";
import { PortalAccess } from "@/components/clients/portal-access";
import { AddContactDialog } from "@/components/clients/add-contact-dialog";
```

with:

```tsx
import { ClientActions } from "@/components/clients/client-actions";
import { AddContactDialog } from "@/components/clients/add-contact-dialog";
```

And add the new import next to `EditContactDialog`:

```tsx
import { EditContactDialog } from "@/components/clients/edit-contact-dialog";
import { ClientNotes } from "@/components/clients/client-notes";
```

becomes:

```tsx
import { EditContactDialog } from "@/components/clients/edit-contact-dialog";
import { ContactPortalAccess } from "@/components/clients/contact-portal-access";
import { ClientNotes } from "@/components/clients/client-notes";
```

- [ ] **Step 2: Render `ContactPortalAccess` inside each contact card**

Replace:

```tsx
                          {contact.telegram && (
                            <span className="text-muted-foreground">
                              @{contact.telegram}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
```

with:

```tsx
                          {contact.telegram && (
                            <span className="text-muted-foreground">
                              @{contact.telegram}
                            </span>
                          )}
                        </div>
                        <ContactPortalAccess clientId={client.id} contact={contact} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
```

- [ ] **Step 3: Remove the old client-level portal access card**

Replace:

```tsx
          {/* Portal Access */}
          <PortalAccess
            clientId={client.id}
            portalToken={client.portalToken}
            portalEnabled={client.portalEnabled}
          />
        </div>
```

with:

```tsx
        </div>
```

- [ ] **Step 4: Delete the old component file**

```bash
rm src/components/clients/portal-access.tsx
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `portal-access.tsx`, `PortalAccess`, `client.portalToken`, or `client.portalEnabled` inside `src/app/(dashboard)/clients/[id]/page.tsx`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/clients/[id]/page.tsx" src/components/clients/contact-portal-access.tsx
git rm src/components/clients/portal-access.tsx
git commit -m "feat: replace client-level portal access card with per-contact control"
```

---

### Task 16: Remove the legacy `Client.portalToken` / `Client.portalEnabled` fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Confirm nothing still references the legacy fields**

Run: `grep -rn "\.portalToken\|\.portalEnabled" src --include="*.ts" --include="*.tsx" | grep -v "clientContact\|contact\.portal\|ClientContact"`
Expected: no output (every remaining reference should be through `ClientContact`/`contact`, not `Client`). If this prints anything, fix that file before continuing — it means Tasks 4–15 missed a consumer.

- [ ] **Step 2: Remove the fields from the `Client` model**

Find this block in `prisma/schema.prisma`:

```prisma
  // Portal
  portalToken   String?   @unique
  portalEnabled Boolean   @default(false)

  // Relations
```

Replace it with:

```prisma
  // Relations
```

Then find:

```prisma
  @@index([name])
  @@index([isArchived])
  @@index([portalToken])
}
```

Replace it with:

```prisma
  @@index([name])
  @@index([isArchived])
}
```

(this closing block belongs to the `Client` model — make sure not to touch the `@@index([portalToken])` that now belongs to `ClientContact`, added in Task 1)

- [ ] **Step 3: Push the schema change**

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.` — Prisma will warn that the `Client.portalToken`/`Client.portalEnabled` columns are being dropped; confirm this is expected (already migrated in Task 2).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): remove legacy client-level portal token fields"
```

---

### Task 17: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors (pre-existing warnings in untouched files are fine).

- [ ] **Step 3: Manual smoke test — admin side**

Run: `npm run dev`, then in the browser:
1. Open a client detail page (`/clients/<id>`), add a contact (or use an existing one).
2. In the contact card, enable "Доступ в портал", check only "Счета", click "Сгенерировать токен", copy it.
3. Confirm the token and `/portal/login` link are shown, and "Отозвать доступ" / "Перегенерировать токен" both work (re-check the page after each, via `router.refresh()`, and confirm no console errors).

- [ ] **Step 4: Manual smoke test — portal side, single permission**

1. Open a private/incognito window, go to `/portal/login`, paste the token from Step 3.
2. Expected: redirected to `/portal`, nav bar shows only "Счета" (no Проекты/Предложения/Документы/Обращения).
3. Navigate directly to `/portal/orders/<any-real-order-id>` by URL.
4. Expected: redirected to `/portal?denied=1` and the amber "нет доступа" banner is visible.

- [ ] **Step 5: Manual smoke test — full access contact**

1. Back in the admin client page, click "Полный доступ" on the same contact.
2. Refresh the portal tab (still logged in with the same token — permissions are read fresh on every request, no re-login needed).
3. Expected: all five nav items now show (Проекты, Предложения, Счета, Документы, Обращения), and `/portal/documents` renders the client's contracts/tech specs/reconciliation acts (or the "Документов пока нет" empty state if none exist).

- [ ] **Step 6: Manual smoke test — zero permissions**

1. Uncheck all 5 checkboxes for the contact (leave "Доступ включён" on).
2. Refresh `/portal`.
3. Expected: the "Доступ не настроен" empty state renders instead of the dashboard, no nav items shown.

- [ ] **Step 7: Commit (if any fixes were needed during verification)**

```bash
git add -A
git commit -m "fix: address issues found during portal RBAC verification"
```
