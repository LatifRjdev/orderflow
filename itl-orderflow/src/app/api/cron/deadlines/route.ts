import { NextResponse } from "next/server";
import { checkDeadlines } from "@/actions/milestones";
import { markOverdueInvoices } from "@/actions/invoices";

export async function GET(request: Request) {
  // Auth via secret header (for cron services like Vercel Cron, Railway, etc.)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deadlinesResult, overdueResult] = await Promise.all([
    checkDeadlines(),
    markOverdueInvoices(),
  ]);

  return NextResponse.json({
    deadlines: deadlinesResult,
    overdueInvoices: overdueResult,
  });
}
