import { AdminLoginForm } from "../login-form";

export function LoginShell() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud-page px-4 py-10 text-cloud-text">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-cloud-header)]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-cloud-heading">
            Sign in
          </h1>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
