"use server";

import { dodoClient } from "@/lib/dodo-payments/client";
import { ServerActionRes } from "@/types/server-action";

export async function changePlan(props: {
  subscriptionId: string;
  productId: string;
}): ServerActionRes {
  try {
    await dodoClient.subscriptions.changePlan(props.subscriptionId, {
      product_id: props.productId,
      proration_billing_mode: "prorated_immediately",
      quantity: 1,
    });
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
