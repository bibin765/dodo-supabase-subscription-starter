import { getUser } from "@/actions/get-user";
import { getProducts } from "@/actions/get-products";
import { ComponentsSection } from "@/components/dashboard/dashboard";
import { redirect } from "next/navigation";
import React from "react";
import { getUserSubscription } from "@/actions/get-user-subscription";
import { SelectSubscription, SelectUser } from "@/lib/drizzle/schema";
import { getInvoices } from "@/actions/get-invoices";

export default async function DashboardPage() {
  const userRes = await getUser();
  const productRes = await getProducts();
  const userSubscriptionRes = await getUserSubscription();
  const invoicesRes = await getInvoices();
  if (!userRes.success) {
    redirect("/login");
  }

  if (!productRes.success) {
    return <div>Error</div>;
  }

  if (!userSubscriptionRes.success) {
    return <div>Error</div>;
  }

  if (!invoicesRes.success) {
    return <div>Error</div>;
  }

  return (
    <div className="px-2">
      <ComponentsSection
        products={productRes.data}
        user={userRes.data}
        userSubscription={userSubscriptionRes.data}
        invoices={invoicesRes.data}
      />
    </div>
  );
}
