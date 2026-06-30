import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { LoginShell } from "./_components/login-shell";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return <LoginShell />;
}

