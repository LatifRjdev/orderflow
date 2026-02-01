import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPortalClient } from "@/actions/portal";
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

    const client = await getPortalClient(token);

    if (!client) {
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

    return NextResponse.json({ success: true, client: { name: client.name } });
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
