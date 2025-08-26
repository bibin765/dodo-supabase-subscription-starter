import { getUser } from "@/actions/get-user";
import AuthForm from "@/components/auth/auth-form";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page() {
  const userRes = await getUser();

  if (userRes.success && userRes.data) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 gap-10">
      <div className="text-center">
        <div className="flex flex-row my-4  items-center h-8 justify-center gap-4 ">
          <Image
            src="/assets/dodo.svg"
            alt="Dodo Payments"
            width={32}
            height={32}
          />
          <Separator orientation="vertical" />

          <Image
            src="/assets/supabase.svg"
            alt="Supabase"
            width={32}
            height={32}
          />
        </div>
        <h2 className="text-xl font-display md:text-2xl font-medium text-primary">
          Dodo Supabase subscription starter
        </h2>
        <p className="text-sm mt-2 text-muted-foreground max-w-xl mx-auto tracking-tight">
          Manage your subscription and payments with Dodo Payments and Supabase.
        </p>
      </div>
      <AuthForm />
    </div>
  );
}
