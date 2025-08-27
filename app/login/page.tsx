import { getUser } from "@/actions/get-user";
import AuthForm from "@/components/auth/auth-form";
import Header from "@/components/layout/header";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page(props: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const userRes = await getUser();
  const { error } = await props.searchParams;

  if (userRes.success && userRes.data) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 gap-10">
      <Header />
      <AuthForm error={error} />
    </div>
  );
}
