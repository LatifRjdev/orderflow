import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInvoicePdf, generateProposalPdf } from "@/actions/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = params;

  let result;

  switch (type) {
    case "invoice":
      result = await generateInvoicePdf(id);
      break;
    case "proposal":
      result = await generateProposalPdf(id);
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.redirect(result.url!);
}
