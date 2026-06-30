import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "./sign-out-button";

async function page() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium text-slate-500">Admin</p>
            <h1 className="text-2xl font-semibold">Survey dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {session.user.username ?? session.user.email}
            </span>
            <AdminSignOutButton />
          </div>
        </header>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">พร้อมใช้งาน</h2>
          <p className="mt-2 text-sm text-slate-600">
            Admin API ถูกป้องกันด้วย Better Auth แล้ว
          </p>
        </section>
      </div>
    </main>
  );
}
export default page
