"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await authClient.signIn.username({
      username,
      password,
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to sign in");
      return;
    }

    const session = await authClient.getSession();

    if (session.error || session.data?.user.role !== "admin") {
      await authClient.signOut();
      setError("This account does not have admin access");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Username
        <input
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-sky-200 transition focus:border-sky-500 focus:ring-3"
          name="username"
          type="text"
          autoComplete="username"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-sky-200 transition focus:border-sky-500 focus:ring-3"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="h-10" disabled={pending}>
        <LockKeyhole />
        Sign in
      </Button>
    </form>
  );
}
