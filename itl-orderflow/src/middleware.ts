import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Публичные маршруты (не требуют авторизации)
const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/api/auth", "/api/portal", "/api/health"];

// Маршруты клиентского портала
const portalRoutes = ["/portal"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Проверяем, является ли это маршрутом портала
  const isPortalRoute = portalRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Портал - отдельная логика авторизации (по токену)
  if (isPortalRoute) {
    return NextResponse.next();
  }

  // Если не авторизован и не публичный маршрут - редирект на логин
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Если авторизован и пытается зайти на логин - редирект на главную
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
