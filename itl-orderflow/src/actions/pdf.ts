"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import React from "react";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";
import { ProposalPdf } from "@/lib/pdf/proposal-pdf";
import { ActPdf } from "@/lib/pdf/act-pdf";
import { ContractPdf } from "@/lib/pdf/contract-pdf";
import { TechSpecPdf } from "@/lib/pdf/tech-spec-pdf";
import { AmendmentPdf } from "@/lib/pdf/amendment-pdf";
import { ReconciliationPdf } from "@/lib/pdf/reconciliation-pdf";

async function getSettings() {
  return prisma.settings.findUnique({ where: { id: "default" } });
}

export async function generateInvoicePdf(invoiceId: string) {
  await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      items: { orderBy: { position: "asc" } },
    },
  });

  if (!invoice) return { error: "Счёт не найден" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(InvoicePdf, { invoice, settings }) as any
  );

  const key = `pdfs/invoices/${invoice.number.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      generatedPdfUrl: blob.url,
      generatedPdfKey: key,
    },
  });

  revalidatePath(`/finance/${invoiceId}`);
  return { success: true, url: blob.url };
}

export async function generateProposalPdf(proposalId: string) {
  await requireAuth();

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      items: { orderBy: { position: "asc" } },
      sections: { orderBy: { position: "asc" } },
      payments: { orderBy: { position: "asc" } },
    },
  });

  if (!proposal) return { error: "КП не найдено" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(ProposalPdf, { proposal, settings }) as any
  );

  const key = `pdfs/proposals/${proposal.number.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      generatedPdfUrl: blob.url,
      generatedPdfKey: key,
    },
  });

  revalidatePath(`/proposals/${proposalId}`);
  return { success: true, url: blob.url };
}

export async function generateActPdf(
  orderId: string,
  data: {
    actNumber: string;
    actDate: string;
    items: { description: string; quantity: number; unitPrice: number; amount: number }[];
    totalAmount: number;
    currency: string;
  }
) {
  await requireAuth();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: true,
    },
  });

  if (!order) return { error: "Заказ не найден" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(ActPdf, {
      actNumber: data.actNumber,
      actDate: data.actDate,
      order,
      client: order.client,
      settings,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: data.currency,
    }) as any
  );

  const key = `pdfs/acts/ACT_${data.actNumber.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  return { success: true, url: blob.url };
}

export async function generateContractPdf(contractId: string) {
  await requireAuth();

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      sections: { orderBy: { position: "asc" } },
    },
  });

  if (!contract) return { error: "Договор не найден" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(ContractPdf, { contract, settings }) as any
  );

  const key = `pdfs/contracts/${contract.number.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      generatedPdfUrl: blob.url,
      generatedPdfKey: key,
    },
  });

  revalidatePath(`/documents/contracts/${contractId}`);
  return { success: true, url: blob.url };
}

export async function generateTechSpecPdf(specId: string) {
  await requireAuth();

  const spec = await prisma.techSpec.findUnique({
    where: { id: specId },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      sections: { orderBy: { position: "asc" } },
    },
  });

  if (!spec) return { error: "ТЗ не найдено" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(TechSpecPdf, { spec, settings }) as any
  );

  const key = `pdfs/specs/${spec.number.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  await prisma.techSpec.update({
    where: { id: specId },
    data: {
      generatedPdfUrl: blob.url,
      generatedPdfKey: key,
    },
  });

  revalidatePath(`/documents/specs/${specId}`);
  return { success: true, url: blob.url };
}

export async function generateAmendmentPdf(amendmentId: string) {
  await requireAuth();

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    include: {
      contract: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!amendment) return { error: "Доп. соглашение не найдено" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(AmendmentPdf, { amendment, settings }) as any
  );

  const key = `pdfs/amendments/${amendment.number.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  await prisma.amendment.update({
    where: { id: amendmentId },
    data: {
      generatedPdfUrl: blob.url,
      generatedPdfKey: key,
    },
  });

  revalidatePath(`/documents/amendments/${amendmentId}`);
  return { success: true, url: blob.url };
}

export async function generateReconciliationPdf(reconciliationId: string) {
  await requireAuth();

  const reconciliation = await prisma.reconciliation.findUnique({
    where: { id: reconciliationId },
    include: {
      client: true,
      entries: { orderBy: { position: "asc" } },
    },
  });

  if (!reconciliation) return { error: "Акт сверки не найден" };

  const settings = await getSettings();

  const buffer = await renderToBuffer(
    React.createElement(ReconciliationPdf, { reconciliation, settings }) as any
  );

  const key = `pdfs/reconciliations/${reconciliation.number.replace(/\s+/g, "_")}.pdf`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  await prisma.reconciliation.update({
    where: { id: reconciliationId },
    data: {
      generatedPdfUrl: blob.url,
      generatedPdfKey: key,
    },
  });

  revalidatePath(`/documents/reconciliations/${reconciliationId}`);
  return { success: true, url: blob.url };
}
