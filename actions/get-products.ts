"use server";

import { dodoClient } from "@/lib/dodo-payments/client";
import { ServerActionRes } from "@/types/server-action";
import { ProductListResponse } from "dodopayments/resources/index.mjs";

export async function getProducts(): ServerActionRes<ProductListResponse[]> {
  try {
    const products = await dodoClient.products.list();
    return { success: true, data: products.items };
  } catch (error) {
    return { success: false, error: "Failed to fetch products" };
  }
}
