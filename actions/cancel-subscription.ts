"use server";

import { dodoClient } from "@/lib/dodo-payments/client";
import { db } from "@/lib/drizzle/client";
import { subscriptions } from "@/lib/drizzle/schema";
import { ServerActionRes } from "@/types/server-action";
import { eq } from "drizzle-orm";

export async function cancelSubscription(props: {
  subscriptionId: string;
}): ServerActionRes {
  try {
    console.log("props", props);
    const res = await dodoClient.subscriptions.update(props.subscriptionId, {
      cancel_at_next_billing_date: true,
    });

    await db
      .update(subscriptions)
      .set({
        cancelAtNextBillingDate: true,
      })
      .where(eq(subscriptions.subscriptionId, props.subscriptionId));

    console.log("res", res);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
