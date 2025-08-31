import { getUser } from "@/actions/get-user";
import { getProducts } from "@/actions/get-products";
import { Dashboard } from "@/components/dashboard/dashboard";
import { redirect } from "next/navigation";
import React from "react";
import { getUserSubscription } from "@/actions/get-user-subscription";
import { getInvoices } from "@/actions/get-invoices";

export default async function DashboardPage() {
  const userRes = await getUser();
  const productRes = await getProducts();
  const userSubscriptionRes = await getUserSubscription();
  const invoicesRes = await getInvoices();
  if (!userRes.success) {
    redirect("/login");
  }

  if (
    !productRes.success ||
    !userSubscriptionRes.success ||
    !invoicesRes.success
  ) {
    // TODO: Replace this with an error boundary
    return <div>Internal Server Error</div>;
  }

  return (
    <div className="px-2">
      <Dashboard
        products={productRes.data}
        user={userRes.data}
        userSubscription={userSubscriptionRes.data}
        invoices={invoicesRes.data}
      />
    </div>
  );
}
