import { getUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardPage() {
  const userRes = await getUser();

  if (!userRes.success) {
    redirect("/login");
  }

  return <div>DashboardPage</div>;
}
