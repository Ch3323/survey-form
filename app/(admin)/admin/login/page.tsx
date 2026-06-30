import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">Admin</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}

