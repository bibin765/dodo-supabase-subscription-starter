import { getUser } from "@/actions/get-user";
import { getProducts } from "@/actions/get-products";
import { ComponentsSection } from "@/components/dashboard";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardPage() {
  const userRes = await getUser();
  const productRes = await getProducts();

  if (!userRes.success) {
    redirect("/login");
  }

  if (!productRes.success) {
    return <div>Error: {productRes.error}</div>;
  }

  return (
    <div className="px-2">
      <ComponentsSection products={productRes.data} />
    </div>
  );
}
