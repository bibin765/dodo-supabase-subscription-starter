"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { motion } from "framer-motion";
import { CreditCard, ReceiptText, UserIcon } from "lucide-react";
import { ProductListResponse } from "dodopayments/resources/index.mjs";
import { User } from "@supabase/supabase-js";
import {
  SelectPayment,
  SelectSubscription,
  SelectUser,
} from "@/lib/drizzle/schema";
import { InvoiceHistory } from "./invoice-history";
import { toast } from "sonner";
import { changePlan } from "@/actions/change-plan";
import { SubscriptionManagement } from "./subscription-management";
import { cancelSubscription } from "@/actions/cancel-subscription";
import { AccountManagement } from "./account-management";
import Header from "../layout/header";
import { MUIThemeProvider } from "./theme-provider";
import { MUIDashboard } from "./mui-dashboard";

export function Dashboard(props: {
  products: ProductListResponse[];
  user: User;
  userSubscription: {
    subscription: SelectSubscription | null;
    user: SelectUser;
  };
  invoices: SelectPayment[];
}) {
  const handlePlanChange = async (productId: string) => {
    if (props.userSubscription.user.currentSubscriptionId) {
      const res = await changePlan({
        subscriptionId: props.userSubscription.user.currentSubscriptionId,
        productId,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success("Plan changed successfully");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.reload();
      return;
    }

    try {
      const response = await fetch(`${window.location.origin}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{
            product_id: productId,
            quantity: 1,
          }],
          customer: {
            email: props.user.email,
            name: props.user.user_metadata.name,
          },
          return_url: `${window.location.origin}/dashboard`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout process");
    }
  };

  return (
    <MUIThemeProvider>
      <MUIDashboard
        products={props.products}
        user={props.user}
        userSubscription={props.userSubscription}
        invoices={props.invoices}
      />
    </MUIThemeProvider>
  );
}
