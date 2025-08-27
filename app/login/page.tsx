import { getUser } from "@/actions/get-user";
import GoogleSignIn from "@/components/auth/google-signin";
import Header from "@/components/layout/header";
import TailwindBadge from "@/components/ui/tailwind-badge";
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
      {error && (
        <TailwindBadge variant="red" className="mt-20">
          {error}
        </TailwindBadge>
      )}
      <GoogleSignIn />
    </div>
  );
}
