"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await authClient.signIn.username({
      username,
      password,
    });

    setPending(false);

    if (result.error) {
      toast.error(result.error.message ?? "Unable to sign in");
      return;
    }

    const session = await authClient.getSession();

    if (session.error || session.data?.user.role !== "admin") {
      await authClient.signOut();
      toast.error("This account does not have admin access");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Username
        <Input
          className="h-10"
          name="username"
          type="text"
          autoComplete="username"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <Input
          className="h-10"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <Button type="submit" className="h-10" disabled={pending}>
        {pending ? <Spinner /> : <LockKeyhole />}
        Sign in
      </Button>
    </form>
  );
}
