"use server";

import { db } from "@/lib/drizzle/client";
import { getUserSubscription } from "./get-user-subscription";
import { payments, SelectPayment } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { ServerActionRes } from "@/types/server-action";

export async function getInvoices(): ServerActionRes<SelectPayment[]> {
  try {
    const subscriptionRes = await getUserSubscription();

    if (!subscriptionRes.success) {
      return { success: false, error: "Subscription not found" };
    }

    const invoices = await db.query.payments.findMany({
      where: eq(payments.customerId, subscriptionRes.data.user.dodoCustomerId),
    });

    return { success: true, data: invoices };
  } catch (error) {
    return { success: false, error: "Failed to get invoices" };
  }
}
