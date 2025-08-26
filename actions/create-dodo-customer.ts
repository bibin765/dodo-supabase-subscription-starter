"use server";

import { dodoClient } from "@/lib/dodo-payments/client";
import { createClient } from "@/lib/supabase/server";
import { ServerActionRes } from "@/types/server-action";
import { Customer } from "dodopayments/resources/index.mjs";

export async function createDodoCustomer(props: {
  email: string;
  name?: string;
}): ServerActionRes<Customer> {
  try {
    const customer = await dodoClient.customers.create({
      email: props.email,
      name: props.name ? props.name : props.email.split("@")[0],
    });

    return { success: true, data: customer };
  } catch (error) {
    return { success: false, error: "Failed to create customer" };
  }
}
