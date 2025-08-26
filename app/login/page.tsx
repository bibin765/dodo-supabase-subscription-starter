import { getUser } from "@/actions/get-user";
import AuthForm from "@/components/auth/auth-form";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page() {
  const userRes = await getUser();

  if (userRes.success && userRes.data) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <AuthForm />
    </div>
  );
}
