import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminDashboard
      adminName={session.user.username ?? session.user.email ?? "Admin"}
    />
  );
}
