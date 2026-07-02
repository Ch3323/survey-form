import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const API_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const apiGuard = guardApiRequest(request);

    if (apiGuard) {
      return withSecurityHeaders(apiGuard, request);
    }
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

function guardApiRequest(request: NextRequest) {
  if (!API_METHODS.has(request.method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (request.method === "OPTIONS") {
    return preflightResponse(request);
  }

  if (MUTATING_METHODS.has(request.method) && !originIsAllowed(request)) {
    return NextResponse.json({ error: "Origin is not allowed" }, { status: 403 });
  }

  return null;
}

function preflightResponse(request: NextRequest) {
  if (!originIsAllowed(request)) {
    return NextResponse.json({ error: "Origin is not allowed" }, { status: 403 });
  }

  return new NextResponse(null, { status: 204 });
}

function originIsAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return allowedOrigins(request).has(normalizeOrigin(origin));
}

function allowedOrigins(request: NextRequest) {
  const origins = new Set<string>([request.nextUrl.origin]);
  const configuredOrigins = [
    process.env.APP_ORIGIN,
    process.env.BETTER_AUTH_URL,
    process.env.CORS_ALLOWED_ORIGINS,
  ];

  for (const value of configuredOrigins) {
    if (!value) {
      continue;
    }

    for (const origin of value.split(",")) {
      const normalized = normalizeOrigin(origin);

      if (normalized) {
        origins.add(normalized);
      }
    }
  }

  return origins;
}

function normalizeOrigin(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

function withSecurityHeaders(response: NextResponse, request: NextRequest) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
    applyCorsHeaders(response, request);
  }

  return response;
}

function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && originIsAllowed(request)) {
    response.headers.set("Access-Control-Allow-Origin", normalizeOrigin(origin));
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Cron-Secret",
  );
  response.headers.set("Access-Control-Max-Age", "600");
}
