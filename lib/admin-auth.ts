import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAdminSession(headersList?: Headers) {
  const session = await auth.api.getSession({
    headers: headersList ?? (await headers()),
  });

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function requireAdmin(headersList?: Headers) {
  const session = await getAdminSession(headersList);

  if (!session) {
    throw new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  return session;
}

