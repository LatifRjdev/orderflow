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
